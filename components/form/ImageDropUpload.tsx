"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { signOut } from "next-auth/react";
import { MAX_IMAGE_BYTES, MAX_IMAGE_PIXELS, parseSegmentation, drawReceiptPreview, extractReceipt, receiptFilename, type Point } from "@/lib/receipt-segmentation";


type Props = {
    userId: string;
    path?: string;
    onUploaded?: (data: { success?: boolean; id?: string; webViewLink?: string }) => void;
    onClose?: () => void;
    parentId: string;
};

const ACCEPTED = ["image/png", "image/jpeg"];

function dataUrlToFile(dataUrl: string, filenameBase: string) {
    const [meta, b64] = dataUrl.split(",");
    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mime = mimeMatch?.[1] || "image/jpeg";

    const ext =
        mime === "image/png"
            ? "png"
            : mime === "image/webp"
                ? "webp"
                : mime === "image/gif"
                    ? "gif"
                    : "jpg";

    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);

    return new File([arr], `${filenameBase}.${ext}`, { type: mime });
}

export default function ImageDropUpload({
                                            userId,
                                            path = "/",
                                            onUploaded,
                                            onClose,
                                            parentId,
                                        }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [filename, setFilename] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);



    const webcamRef = useRef<Webcam | null>(null);

    const [mode, setMode] = useState<"idle" | "camera" | "captured">("idle");
    const [captured, setCaptured] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const uploadLock = useRef(false);
    const signingOut = useRef(false);
    const generation = useRef(0);
    const [retry, setRetry] = useState(0);
    const selection = useRef<{ image: ImageBitmap; polygon: Point[] } | null>(null);
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");
    useEffect(() => {
        const id = ++generation.current;
        const controller = new AbortController();
        let image: ImageBitmap | undefined;
        if (!file) return;
        const current = () => !controller.signal.aborted && generation.current === id;
        void (async () => {
            try {
                const body = new FormData(); body.append("file", file);
                const response = await fetch("/api/receipts/segment", { method: "POST", body, signal: controller.signal });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Segmentace selhala.");
                const result = parseSegmentation(data);
                if (!current()) return;
                image = await createImageBitmap(file, { imageOrientation: "from-image" });
                if (!current()) return;
                if (image.width * image.height > MAX_IMAGE_PIXELS) throw new Error("Překročen limit 25 milionů pixelů.");
                const canvas = canvasRef.current;
                if (!canvas) return;
                canvas.width = image.width; canvas.height = image.height;
                canvas.getContext("2d")!.drawImage(image, 0, 0);
                if (!result.detected) { setStatus("empty"); setMessage("Účtenka nebyla nalezena. Zkus jiný obrázek nebo opakuj hledání."); return; }
                drawReceiptPreview(image, result.polygon, canvas);
                if (!current()) return;
                selection.current = { image, polygon: result.polygon };
                setStatus("ready"); setMessage("Zkontroluj označenou účtenku.");
            } catch (error) {
                if (current()) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Segmentace selhala."); }
            } finally { if (image !== selection.current?.image) image?.close(); }
        })();
        return () => { controller.abort(); generation.current = id + 1; image?.close(); selection.current = null; };
    }, [file, retry]);

    const setImage = useCallback(
        (f: File | null) => {
            if (!f || uploadLock.current) return;

            if (!ACCEPTED.includes(f.type)) {
                alert("Prosím nahraj obrázek JPEG nebo PNG.");
                return;
            }

            if (f.size > MAX_IMAGE_BYTES) { alert("Maximální velikost je 15 MiB."); return; }
            generation.current++; selection.current = null; setStatus("loading");
            setMessage("Hledám účtenku…");
            if (canvasRef.current) { canvasRef.current.width = 0; canvasRef.current.height = 0; }
            setFile(f);

            if (!filename.trim()) {
                const base = f.name.replace(/\.(png|jpe?g|webp|gif)$/i, "");
                setFilename(base);
            }

            setMode("idle");
            setCaptured(null);
        },
        [filename]
    );

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) setImage(dropped);
    };

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        if (picked) setImage(picked);
    };

    const clear = () => {
        if (uploadLock.current) return;
        generation.current++; selection.current = null;
        setFile(null);
        setFilename("");
        setCaptured(null);
        setMode("idle");
    };

    const startCamera = () => {
        setCaptured(null);
        setMode("camera");
    };

    const takePhoto = () => {
        const screenshot = webcamRef.current?.getScreenshot();

        if (!screenshot) {
            alert("Nepodařilo se vyfotit. Zkus to znovu.");
            return;
        }

        setCaptured(screenshot);
        setMode("captured");
    };

    const useCaptured = () => {
        if (!captured) return;
        const base = (filename.trim() || `uctenka-${Date.now()}`).replace(/\.(png|jpe?g|webp|gif)$/i, "");
        const f = dataUrlToFile(captured, base);
        setImage(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (uploadLock.current || status !== "ready" || !selection.current) return;
        if (!file) return alert("Přetáhni / vyber obrázek nebo vyfoť.");
        if (!filename.trim()) return alert("Zadej název souboru.");
        if (filename.trim().length > 100) return alert("Název může mít maximálně 100 znaků.");
        if (!userId) return alert("Chybí userId (session).");
        if (!path) return alert("Chybí path.");

        const selected = selection.current;
        const id = generation.current;
        const finalName = receiptFilename(filename);
        try {
            uploadLock.current = true;
            setLoading(true);
            setMessage("Vytvářím výřez…");
            const receipt = await extractReceipt(selected.image, selected.polygon);
            if (generation.current !== id) return;
            const extractedFile = new File([receipt], finalName, { type: "image/png" });
            const formData = new FormData();
            formData.append("file", extractedFile);
            formData.append("filename", finalName);
            formData.append("path", String(path));
            formData.append("userId", String(userId));
            formData.append("parentId", String(parentId));
            setMessage("Nahrávám účtenku…");
            const res = await fetch("/api/firestore/Files", {
                method: "POST",
                body: formData,
            });

            const text = await res.text();
            const data = text
                ? (() => {
                    try {
                        return JSON.parse(text);
                    } catch {
                        return { raw: text };
                    }
                })()
                : {};

            if (generation.current !== id) return;
            if (res.status === 401 && data?.code === "REAUTH_REQUIRED") {
                signingOut.current = true;
                setMessage("Přístup ke Google Drive vypršel. Odhlašuji…");
                try {
                    await signOut({ callbackUrl: "/?reason=google-reconnect" });
                } catch {
                    signingOut.current = false;
                    throw new Error("Odhlášení se nezdařilo. Zkus to prosím znovu.");
                }
                return;
            }
            if (!res.ok) {
                throw new Error(data?.error || data?.message || "Chyba při uploadu");
            }

            if (generation.current !== id) return;
            onUploaded?.(data);
            alert("Obrázek nahrán!");
            uploadLock.current = false;
            clear();
            onClose?.();
        } catch (err: unknown) {
            if (generation.current === id) setMessage(err instanceof Error ? err.message : "Uložení selhalo. Zkus to znovu.");
        } finally {
            if (!signingOut.current) {
                uploadLock.current = false;
                setLoading(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div
                onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                }}
                onDrop={onDrop}
                className={[
                    "rounded-xl border-2 border-dashed p-6 text-center transition",
                    dragOver ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50",
                ].join(" ")}
            >
                <input id="image" type="file" accept="image/jpeg,image/png" onChange={onPick} className="hidden" />

                {mode === "camera" && (
                    <div className="flex flex-col gap-3 items-center">
                        <div className="relative w-full h-80 overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                screenshotQuality={0.95}
                                videoConstraints={{
                                    facingMode,
                                    aspectRatio: 1.3333333333,
                                }}
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-md bg-slate-900/70 px-3 py-1 text-xs text-white">
                                Zamiř na účtenku
                            </div>
                        </div>

                        <div className="flex gap-2 justify-center flex-wrap">
                            <button
                                type="button"
                                onClick={() => setMode("idle")}
                                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
                            >
                                Zrušit
                            </button>

                            <button
                                type="button"
                                onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
                                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
                            >
                                Přepnout kameru
                            </button>

                            <button
                                type="button"
                                onClick={takePhoto}
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm"
                            >
                                Vyfotit
                            </button>
                        </div>

                        <p className="text-xs text-slate-400">
                            Zarovnej účtenku do záběru a stiskni tlačítko.
                        </p>
                    </div>
                )}

                {mode === "captured" && captured && (
                    <div className="flex flex-col gap-3 items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={captured}
                            alt="captured"
                            className="max-h-72 rounded-lg border border-slate-200 object-contain bg-white"
                        />

                        <div className="flex gap-2 justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setCaptured(null);
                                    setMode("camera");
                                }}
                                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
                            >
                                Znovu
                            </button>
                            <button
                                type="button"
                                onClick={useCaptured}
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm"
                            >
                                Použít fotku
                            </button>
                        </div>
                    </div>
                )}

                {mode === "idle" && !file && (
                    <div className="flex flex-col gap-3 items-center">
                        <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                            <span className="text-emerald-500 text-lg">↑</span>
                        </div>
                        <p className="text-sm text-slate-500">
                            Přetáhni sem obrázek nebo{" "}
                            <label htmlFor="image" className="text-emerald-600 underline cursor-pointer font-semibold">
                                vyber soubor
                            </label>
                        </p>

                        <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition shadow-sm"
                        >
                            Vyfotit účtenku
                        </button>

                        <p className="text-[11px] text-slate-400">JPEG, PNG · max. 15 MiB</p>
                    </div>
                )}

                {mode === "idle" && file && (
                    <div className="flex flex-col gap-3 items-center">
                        <canvas ref={canvasRef} aria-label="Vybraná účtenka" className="max-h-72 max-w-full h-auto rounded-lg border border-slate-200" />
                        <p role="status" className="text-sm text-slate-600">{message}</p>
                        {(status === "error" || status === "empty") && <button type="button" onClick={() => { generation.current++; selection.current = null; setStatus("loading"); setMessage("Hledám účtenku…"); setRetry(n => n + 1); }} className="text-sm text-emerald-600 underline">Zkusit znovu</button>}
                        <div className="text-sm text-slate-600 text-left w-full">
                            <div className="truncate">
                                <span className="font-semibold text-slate-800">Soubor:</span> {file.name}
                            </div>
                            <div className="tnum">
                                <span className="font-semibold text-slate-800">Velikost:</span> {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                        </div>

                        <button type="button" onClick={clear} className="text-sm text-rose-600 hover:text-rose-700 font-medium transition">
                            Odebrat
                        </button>
                    </div>
                )}
            </div>

            <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Název účtenky</label>
                <input
                    type="text"
                    placeholder="Např. Nákup Lidl"
                    value={filename}
                    maxLength={100}
                    onChange={(e) => setFilename(e.target.value)}
                    className="w-full border border-slate-200 bg-white px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
            </div>

            <div className="flex gap-2 justify-end pt-1">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
                >
                    Zrušit
                </button>
                <button
                    type="submit"
                    disabled={loading || status !== "ready"}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition disabled:opacity-50 shadow-sm"
                >
                    {loading ? "Ukládám..." : "Potvrdit a uložit"}
                </button>
            </div>
        </form>
    );
}
