"use client";

import React, {ComponentType, useCallback, useEffect, useMemo, useRef, useState} from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import {WebcamProps} from "react-webcam";

const Webcam = dynamic(
    () => import("react-webcam").then((m) => m.default as unknown as ComponentType<WebcamProps>),
    { ssr: false }
);
type Props = {
    userId: string;
    path?: string;
    onUploaded?: (data: any) => void;
    onClose?: () => void;
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
                                            userId,
                                            path = "/",
                                            onUploaded,
                                            onClose,
                                        }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [filename, setFilename] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);

    const { data: session } = useSession();
    const { update } = useSession();

    // webcam ref + modes
    const webcamRef = useRef<any>(null);
    const [mode, setMode] = useState<"idle" | "camera" | "captured">("idle");
    const [captured, setCaptured] = useState<string | null>(null);

    // optional: let user flip camera (front/back)
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

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
        setCaptured(null);
        setMode("camera");
    };

    const takePhoto = () => {
        const photo: string | null = webcamRef.current?.getScreenshot?.();
        if (!photo) {
            alert("Nepodařilo se vyfotit. Zkus to znovu (nebo zkontroluj oprávnění kamery).");
            return;
        }
        setCaptured(photo);
        setMode("captured");
    };

    const useCaptured = () => {
        if (!captured) return;
        const base = (filename.trim() || `foto-${Date.now()}`).replace(/\.[^/.]+$/, "");
        const f = dataUrlToFile(captured, base);
        setImage(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) return alert("Přetáhni / vyber obrázek nebo vyfoť.");
        if (!filename.trim()) return alert("Zadej název souboru.");
        if (!userId) return alert("Chybí userId (session).");
        if (!path) return alert("Chybí path.");

        const originalExt = file.name.includes(".") ? file.name.split(".").pop() : "";
        const inputName = filename.trim();
        const hasExt =
            originalExt && inputName.toLowerCase().endsWith("." + originalExt.toLowerCase());

        const finalName = originalExt ? (hasExt ? inputName : `${inputName}.${originalExt}`) : inputName;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", finalName);
        formData.append("path", String(path));
        formData.append("userId", String(userId));

        try {
            setLoading(true);

            const checkRes = await fetch(
                `https://oauth2.googleapis.com/tokeninfo?access_token=${session?.accessToken}`
            );
            const tokeninfo = await checkRes.json();

            if ((tokeninfo.expires_in as number) < 30 || tokeninfo.error === "invalid_token") {
                await update({});
            }

            const res = await fetch("/api/firestore/Push", {
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

            onUploaded?.(data);
            alert("Obrázek nahrán!");
            clear();
            onClose?.();
        } catch (err: any) {
            alert(err?.message ?? "Něco se pokazilo.");
        } finally {
            setLoading(false);
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
                    "rounded-3xl border-2 border-dashed p-6 text-center transition",
                    dragOver ? "border-sky-500 bg-sky-50" : "border-gray-300 bg-white/60",
                ].join(" ")}
            >
                <input id="image" type="file" accept="image/*" onChange={onPick} className="hidden" />

                {/* 1) Camera mode */}
                {mode === "camera" && (
                    <div className="flex flex-col gap-3 items-center">
                        <div className="relative w-full h-64 overflow-hidden rounded-2xl border bg-white">
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                screenshotQuality={0.95}
                                videoConstraints={{ facingMode }}
                                className="w-full h-full object-cover"
                            />
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
                            Pokud kamera nenaběhne, zkontroluj oprávnění v prohlížeči.
                        </p>
                    </div>
                )}

                {/* 2) Captured mode */}
                {mode === "captured" && captured && (
                    <div className="flex flex-col gap-3 items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={captured}
                            alt="captured"
                            className="max-h-48 rounded-2xl border object-contain bg-white"
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

                {/* 3) Idle mode */}
                {mode === "idle" && !file && (
                    <div className="flex flex-col gap-2 items-center">
                        <p className="text-sm text-gray-600">
                            Přetáhni sem obrázek nebo{" "}
                            <label htmlFor="image" className="text-sky-700 underline cursor-pointer font-semibold">
                                vyber soubor
                            </label>
                        </p>

                        <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition"
                        >
                            Vyfotit
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

            <input
                type="text"
                placeholder="Název obrázku"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="border border-gray-200 bg-white/80 p-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-sky-200"
            />

            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white/80 hover:bg-white text-gray-800 font-semibold text-sm transition"
                >
                    Zrušit
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition disabled:opacity-60"
                >
                    {loading ? "Nahrávám..." : "Nahrát"}
                </button>
            </div>
        </form>
    );
}