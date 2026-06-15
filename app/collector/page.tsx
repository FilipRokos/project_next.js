"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useSession } from "next-auth/react";

type Props = {
    userId: string;
    path?: string;
    onUploaded?: (data: any) => void;
    onClose?: () => void;
    parentId: string;
};

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

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

                                        }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [filename, setFilename] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);

    const { data: session, update } = useSession();

    const webcamRef = useRef<Webcam | null>(null);
    const captureInputRef = useRef<HTMLInputElement | null>(null);

    const [isMobile, setIsMobile] = useState(false);
    const [mode, setMode] = useState<"idle" | "camera" | "captured">("idle");
    const [captured, setCaptured] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

    useEffect(() => {
        const mobile =
            typeof navigator !== "undefined" &&
            (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
                (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches));
        setIsMobile(mobile);
    }, []);

    const previewUrl = useMemo(() => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, [file]);

    useEffect(() => {
        if (!previewUrl) return;
        return () => URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const setImage = useCallback(
        (f: File | null) => {
            if (!f) return;

            if (!ACCEPTED.includes(f.type)) {
                alert("Prosím nahraj obrázek (png, jpg, webp, gif).");
                return;
            }

            setFile(f);

            if (!filename.trim()) {
                const base = f.name.replace(/\.[^/.]+$/, "");
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
        setFile(null);
        setFilename("");
        setCaptured(null);
        setMode("idle");
    };

    const startCamera = () => {
        // On phones, open the native camera app directly via a capture file input.
        // On desktop (no native camera), fall back to the in-page react-webcam.
        if (isMobile) {
            captureInputRef.current?.click();
            return;
        }
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
        const base = (filename.trim() || `uctenka-${Date.now()}`).replace(/\.[^/.]+$/, "");
        const f = dataUrlToFile(captured, base);
        setImage(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) return alert("Přetáhni / vyber obrázek nebo vyfoť.");
        if (!filename.trim()) return alert("Zadej název souboru.");


        const originalExt = file.name.includes(".") ? file.name.split(".").pop() : "";
        const inputName = filename.trim();
        const hasExt =
            originalExt && inputName.toLowerCase().endsWith("." + originalExt.toLowerCase());

        const finalName = originalExt ? (hasExt ? inputName : `${inputName}.${originalExt}`) : inputName;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", finalName);


        try {
            setLoading(true);


            const res = await fetch("/api/collector", {
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

            if (!res.ok) {
                throw new Error((data as any)?.error || (data as any)?.message || "Chyba při uploadu");
            }

            alert("Obrázek nahrán!");
            clear();
        } catch (err: any) {
            alert(err?.message ?? "Něco se pokazilo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
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
                    "rounded-3xl border-2 border-dashed p-6 text-center transition",
                    dragOver ? "border-sky-500 bg-sky-50" : "border-gray-300 bg-white/60",
                ].join(" ")}
            >
                <input id="image" type="file" accept="image/*" onChange={onPick} className="hidden" />

                {/* Native phone camera (opens the back camera directly on mobile) */}
                <input
                    ref={captureInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={onPick}
                    className="hidden"
                />

                {mode === "camera" && (
                    <div className="flex flex-col gap-3 items-center">
                        <div className="relative w-full h-80 overflow-hidden rounded-2xl border bg-black">
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

                            <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                                Zamiř na účtenku
                            </div>
                        </div>

                        <div className="flex gap-2 justify-center flex-wrap">
                            <button
                                type="button"
                                onClick={() => setMode("idle")}
                                className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition"
                            >
                                Zrušit
                            </button>

                            <button
                                type="button"
                                onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
                                className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition"
                            >
                                Přepnout kameru
                            </button>

                            <button
                                type="button"
                                onClick={takePhoto}
                                className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition"
                            >
                                Vyfotit
                            </button>
                        </div>

                        <p className="text-xs text-gray-500">
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
                            className="max-h-72 rounded-2xl border object-contain bg-white"
                        />

                        <div className="flex gap-2 justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setCaptured(null);
                                    setMode("camera");
                                }}
                                className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition"
                            >
                                Znovu
                            </button>
                            <button
                                type="button"
                                onClick={useCaptured}
                                className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition"
                            >
                                Použít fotku
                            </button>
                        </div>
                    </div>
                )}

                {mode === "idle" && !file && (
                    <div className="flex flex-col gap-2 items-center">
                        <a href={"https://deltassie-my.sharepoint.com/:f:/g/personal/rokofi_delta-studenti_cz/IgAdlvSfE_8qR5POdR4uwOEcAVBVLb6PsG2FAIHuUdKN46M"} className="text-sky-700 underline cursor-pointer font-semibold">
                            nahaj
                        </a>

                        <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition"
                        >
                            Vyfotit účtenku
                        </button>

                        <p className="text-xs text-gray-500">png, jpg, webp, gif</p>
                    </div>
                )}

                {mode === "idle" && file && (
                    <div className="flex flex-col gap-3 items-center">
                        {previewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={previewUrl}
                                alt="preview"
                                className="max-h-48 rounded-2xl border object-contain bg-white"
                            />
                        )}

                        <div className="text-sm text-gray-700 text-left w-full">
                            <div className="truncate">
                                <b>Soubor:</b> {file.name}
                            </div>
                            <div>
                                <b>Velikost:</b> {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                        </div>

                        <button type="button" onClick={clear} className="text-sm text-red-600 underline">
                            Odebrat
                        </button>
                    </div>
                )}
            </div>

            <div className="">

                <button
                    type="submit"
                    disabled={loading}
                    className="px-4  py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition disabled:opacity-60"
                >
                    {loading ? "Nahrávám..." : "Nahrát"}
                </button>
            </div>
        </form>
        </div>
    );
}
