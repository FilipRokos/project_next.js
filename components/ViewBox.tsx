"use client";

import { FaFileAlt, FaPlus } from "react-icons/fa";
import { useState } from "react";

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

export default function ViewBox({
                                    path,
                                    items = [],
                                    onFolderClick,
                                }: ViewBoxProps) {
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    console.log(items)
    return (
        <main className="flex-1 py-8 animate-in-delay">
            <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur shadow-sm">
                {/* HEADER */}
                <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                            {path.map((p, i) => (
                                <div key={p.id} className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            onFolderClick?.(p.id, p.name);
                                        }}
                                        className="hover:text-gray-900 transition"
                                    >
                                        {p.name}
                                    </button>

                                    {i < path.length - 1 && <span>{">"}</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:hidden flex gap-2">
                        <button className="bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-2xl text-sm font-semibold text-white transition shadow-sm active:scale-[0.98]">
                            <span className="inline-flex items-center gap-2">
                                <FaPlus />
                                Složka
                            </span>
                        </button>

                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="bg-white/80 hover:bg-white border border-gray-200 px-4 py-2 rounded-2xl text-sm font-semibold text-gray-800 transition active:scale-[0.98]"
                        >
                            <span className="inline-flex items-center gap-2">
                                <FaFileAlt />
                                Obrázek
                            </span>
                        </button>
                    </div>
                </div>

                {/* GRID */}
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {items.map((item) => {
                            const base = (
                                <div className="h-10 w-10 rounded-2xl mb-3 flex items-center justify-center text-xl">
                                    {item.type === "folder" ? "📁" : "📄"}
                                </div>
                            );

                            // 📁 FOLDER
                            if (item.type === "folder") {
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => onFolderClick?.(item.id, item.title)}                                        className="relative rounded-2xl border border-gray-200 bg-yellow-50 hover:bg-yellow-100 transition cursor-pointer p-5 overflow-hidden"
                                    >
                                        {/* folder top tab efekt */}
                                        <div className="absolute top-0 left-4 w-16 h-3 bg-yellow-200 rounded-b-md" />

                                        {/* icon */}
                                        <div className="text-4xl mt-2">📁</div>

                                        {/* title */}
                                        <div className="mt-3 text-sm font-semibold text-gray-800 truncate">
                                            {item.title}
                                        </div>

                                        <div className="text-xs text-gray-500 mt-1">
                                            Složka
                                        </div>
                                    </div>
                                );
                            }

                            // 📄 FILE
                            return (
                                <div
                                    key={item.id}
                                    className="rounded-3xl border border-gray-200 bg-white/60 p-3 hover:shadow-sm transition cursor-pointer"
                                >
                                    <div className="w-full h-40 rounded-2xl overflow-hidden bg-gray-100 mb-3">
                                        <img
                                            src={`https://drive.google.com/uc?export=view&id=${item.id}`}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                const target = e.currentTarget;

                                                if (!target.dataset.step) {
                                                    target.dataset.step = "1";
                                                    target.src = `https://drive.google.com/thumbnail?id=${item.id}&sz=s800`;
                                                } else {
                                                    target.src =
                                                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='160'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="text-sm font-semibold text-gray-800 truncate">
                                        {item.title}
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="md:hidden h-20" />
        </main>
    );
}