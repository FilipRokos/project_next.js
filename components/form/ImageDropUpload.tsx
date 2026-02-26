"use client";

import React, { useCallback, useMemo, useState } from "react";

type Props = {
    userId: string;
    path?: string;
    onUploaded?: (data: any) => void;
    onClose?: () => void;
};

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

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

    const previewUrl = useMemo(() => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, [file]);

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
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) return alert("Přetáhni nebo vyber obrázek.");
        if (!filename.trim()) return alert("Zadej název souboru.");
        if (!userId) return alert("Chybí userId (session).");
        if (!path) return alert("Chybí path.");

        // 1) přípona z originálního souboru
        const originalExt = file.name.includes(".") ? file.name.split(".").pop() : "";

        // 2) pokud uživatel už napsal příponu, nenech ji zdvojit
        const inputName = filename.trim();
        const hasExt =
            originalExt &&
            inputName.toLowerCase().endsWith("." + originalExt.toLowerCase());

        const finalName = originalExt
            ? hasExt
                ? inputName
                : `${inputName}.${originalExt}`
            : inputName;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", finalName);
        formData.append("path", String(path));
        formData.append("userId", String(userId));

        try {
            setLoading(true);

            const res = await fetch("/api/firestore/Push", {
                method: "POST",
                body: formData,
            });

            // bezpečně přečíst odpověď (ne vždy je to valid json)
            const text = await res.text();
            const data = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : {};

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
                <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={onPick}
                    className="hidden"
                />

                {!file ? (
                    <div className="flex flex-col gap-2 items-center">
                        <p className="text-sm text-gray-600">
                            Přetáhni sem obrázek nebo{" "}
                            <label
                                htmlFor="image"
                                className="text-sky-700 underline cursor-pointer font-semibold"
                            >
                                vyber soubor
                            </label>
                        </p>
                        <p className="text-xs text-gray-500">png, jpg, webp, gif</p>
                    </div>
                ) : (
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

                        <button
                            type="button"
                            onClick={clear}
                            className="text-sm text-red-600 underline"
                        >
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