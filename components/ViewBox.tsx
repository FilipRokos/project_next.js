"use client";

import { FaFolder, FaChevronRight, FaTimes, FaChevronLeft, FaChevronRight as FaChevronRightIcon, FaDownload } from "react-icons/fa";
import { useState, useEffect, useCallback } from "react";

type Item = {
    id: string;
    title: string;
    type: "folder" | "file";
    url?: string;
};

type ViewBoxProps = {
    path: { id: string; name: string }[];
    items?: Item[];
    onFolderClick?: (id: string, name: string) => void;
};

export default function ViewBox({ path, items = [], onFolderClick }: ViewBoxProps) {
    const [lightbox, setLightbox] = useState<number | null>(null);

    const files = items.filter((i) => i.type === "file");

    const openLightbox = (fileId: string) => {
        const idx = files.findIndex((f) => f.id === fileId);
        if (idx !== -1) setLightbox(idx);
    };

    const closeLightbox = () => setLightbox(null);

    const prev = useCallback(() => {
        setLightbox((i) => (i !== null ? (i - 1 + files.length) % files.length : null));
    }, [files.length]);

    const next = useCallback(() => {
        setLightbox((i) => (i !== null ? (i + 1) % files.length : null));
    }, [files.length]);

    useEffect(() => {
        if (lightbox === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightbox, prev, next]);

    return (
        <main className="flex-1 pb-20 md:pb-0">

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-gray-400 mb-4 flex-wrap">
                {path.map((p, i) => {
                    const isLast = i === path.length - 1;
                    return (
                        <div key={p.id ?? "root"} className="flex items-center gap-1">
                            {i > 0 && <FaChevronRight size={9} className="text-gray-300 shrink-0" />}
                            <button
                                onClick={() => onFolderClick?.(p.id, p.name)}
                                className={
                                    isLast
                                        ? "text-gray-900 font-semibold cursor-default"
                                        : "hover:text-gray-900 transition"
                                }
                                disabled={isLast}
                            >
                                {p.name}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Empty state */}
            {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-4xl mb-3">📂</div>
                    <p className="text-sm font-semibold text-gray-500">Zatím prázdné</p>
                    <p className="text-xs text-gray-400 mt-1">Vytvoř složku nebo nahraj soubor.</p>
                </div>
            )}

            {/* Grid */}
            {items.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {items.map((item) => {
                        if (item.type === "folder") {
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onFolderClick?.(item.id, item.title)}
                                    className="rounded-2xl overflow-hidden text-left transition group w-full hover:shadow-md hover:brightness-95 relative"
                                    style={{ background: "#fefce8" }}
                                >
                                    {/* Folder tab */}
                                    <div className="absolute top-0 left-3 w-8 h-2 bg-amber-300 rounded-b-md" />
                                    <div className="w-full aspect-[3/2] flex flex-col justify-between p-2.5 pt-4">
                                        <FaFolder className="text-amber-400" size={20} />
                                        <div>
                                            <p className="text-xs font-bold text-gray-800 truncate">{item.title}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Složka</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        }

                        return (
                            <div
                                key={item.id}
                                onClick={() => openLightbox(item.id)}
                                className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-indigo-200 hover:shadow-sm transition cursor-pointer group"
                            >
                                <div className="w-full aspect-[3/2] bg-gray-100 overflow-hidden">
                                    <img
                                        src={`https://drive.google.com/uc?export=view&id=${item.id}`}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            if (!target.dataset.step) {
                                                target.dataset.step = "1";
                                                target.src = `https://drive.google.com/thumbnail?id=${item.id}&sz=s400`;
                                            } else {
                                                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='11'%3ENo image%3C/text%3E%3C/svg%3E";
                                            }
                                        }}
                                    />
                                </div>
                                <div className="px-2 py-1.5 border-t border-gray-100">
                                    <p className="text-xs font-medium text-gray-700 truncate">{item.title}</p>
                                    <p className="text-[10px] text-gray-400">Účtenka</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Lightbox */}
            {lightbox !== null && files[lightbox] && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Top right actions */}
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                        <a
                            href={`https://drive.google.com/uc?export=download&id=${files[lightbox].id}`}
                            onClick={(e) => e.stopPropagation()}
                            download
                            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                            title="Stáhnout"
                        >
                            <FaDownload size={13} />
                        </a>
                        <button
                            onClick={closeLightbox}
                            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                        >
                            <FaTimes size={14} />
                        </button>
                    </div>

                    {/* Counter */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/60 font-medium">
                        {lightbox + 1} / {files.length}
                    </div>

                    {/* Prev */}
                    {files.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                            className="absolute left-3 md:left-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                        >
                            <FaChevronLeft size={14} />
                        </button>
                    )}

                    {/* Image */}
                    <div
                        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={`https://drive.google.com/uc?export=view&id=${files[lightbox].id}`}
                            alt={files[lightbox].title}
                            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.dataset.step) {
                                    target.dataset.step = "1";
                                    target.src = `https://drive.google.com/thumbnail?id=${files[lightbox].id}&sz=s1600`;
                                }
                            }}
                        />
                    </div>

                    {/* Next */}
                    {files.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); next(); }}
                            className="absolute right-3 md:right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                        >
                            <FaChevronRightIcon size={14} />
                        </button>
                    )}

                    {/* Title */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60 font-medium truncate max-w-[80vw] text-center">
                        {files[lightbox].title}
                    </div>
                </div>
            )}
        </main>
    );
}
