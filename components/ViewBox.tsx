"use client";

import { FaFolder, FaChevronRight, FaTimes, FaChevronLeft, FaChevronRight as FaChevronRightIcon, FaDownload, FaFileImage } from "react-icons/fa";
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
    loading?: boolean;
    onFolderClick?: (id: string, name: string) => void;
};

export default function ViewBox({ path, items = [], loading = false, onFolderClick }: ViewBoxProps) {
    const [lightbox, setLightbox] = useState<number | null>(null);

    const folders = items.filter((i) => i.type === "folder");
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
            <div className="flex items-center gap-1 text-sm text-slate-400 mb-5 flex-wrap">
                {path.map((p, i) => {
                    const isLast = i === path.length - 1;
                    return (
                        <div key={p.id ?? "root"} className="flex items-center gap-1">
                            {i > 0 && <FaChevronRight size={8} className="text-slate-300 shrink-0" />}
                            <button
                                onClick={() => onFolderClick?.(p.id, p.name)}
                                className={
                                    isLast
                                        ? "text-slate-900 font-semibold cursor-default px-1.5 py-0.5"
                                        : "hover:text-slate-900 hover:bg-slate-100 rounded px-1.5 py-0.5 transition"
                                }
                                disabled={isLast}
                            >
                                {p.name}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Loading skeletons */}
            {loading && (
                <div>
                    <div className="h-3 w-20 rounded skeleton mb-2" />
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                <div className="w-full aspect-[4/3] skeleton" />
                                <div className="px-2.5 py-2 border-t border-slate-100">
                                    <div className="h-2.5 w-3/4 rounded skeleton" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-slate-200 rounded-xl bg-white">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                        <FaFolder className="text-slate-300" size={20} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Zatím prázdné</p>
                    <p className="text-xs text-slate-400 mt-1">Vytvoř složku nebo nahraj účtenku.</p>
                </div>
            )}

            {/* Folders section */}
            {!loading && folders.length > 0 && (
                <div className="mb-6">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Složky · {folders.length}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                        {folders.map((item, i) => (
                            <button
                                key={item.id}
                                onClick={() => onFolderClick?.(item.id, item.title)}
                                style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}
                                className="card-in flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 px-3 py-2.5 text-left transition group w-full"
                            >
                                <div className="h-8 w-8 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                                    <FaFolder className="text-amber-400" size={13} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-emerald-700">{item.title}</p>
                                    <p className="text-[10px] text-slate-400">Složka</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Files section */}
            {!loading && files.length > 0 && (
                <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Účtenky · {files.length}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                        {files.map((item, i) => (
                            <div
                                key={item.id}
                                onClick={() => openLightbox(item.id)}
                                style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}
                                className="card-in rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-emerald-300 hover:shadow-sm transition cursor-pointer group"
                            >
                                <div className="w-full aspect-[4/3] bg-slate-100 overflow-hidden">
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
                                                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='11'%3ENo image%3C/text%3E%3C/svg%3E";
                                            }
                                        }}
                                    />
                                </div>
                                <div className="px-2.5 py-2 flex items-center gap-1.5 border-t border-slate-100">
                                    <FaFileImage size={10} className="text-emerald-500 shrink-0" />
                                    <span className="text-[11px] font-medium text-slate-600 truncate">{item.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightbox !== null && files[lightbox] && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center overlay-in"
                    onClick={closeLightbox}
                >
                    {/* Top actions */}
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                        <a
                            href={`https://drive.google.com/uc?export=download&id=${files[lightbox].id}`}
                            onClick={(e) => e.stopPropagation()}
                            download
                            className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                            title="Stáhnout"
                        >
                            <FaDownload size={13} />
                        </a>
                        <button
                            onClick={closeLightbox}
                            className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                        >
                            <FaTimes size={14} />
                        </button>
                    </div>

                    {/* Counter */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-white/50 font-medium tnum">
                        {lightbox + 1} / {files.length}
                    </div>

                    {files.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                            className="absolute left-3 md:left-6 h-10 w-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                        >
                            <FaChevronLeft size={14} />
                        </button>
                    )}

                    <div
                        key={lightbox}
                        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center zoom-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={`https://drive.google.com/uc?export=view&id=${files[lightbox].id}`}
                            alt={files[lightbox].title}
                            className="max-w-full max-h-[85vh] rounded-lg object-contain shadow-2xl"
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

                    {files.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); next(); }}
                            className="absolute right-3 md:right-6 h-10 w-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                        >
                            <FaChevronRightIcon size={14} />
                        </button>
                    )}

                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/60 font-medium truncate max-w-[80vw] text-center">
                        {files[lightbox].title}
                    </div>
                </div>
            )}
        </main>
    );
}
