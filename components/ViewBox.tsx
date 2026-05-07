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

    console.log(path)
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
                                <a
                                    key={item.id}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-3xl border border-gray-200 bg-white/60 p-4 hover:bg-white hover:shadow-sm transition block"
                                >
                                    {base}

                                    <div className="text-sm font-semibold text-gray-800 truncate">
                                        {item.title}
                                    </div>

                                    <div className="text-xs text-sky-600 truncate mt-1">
                                        Soubor
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="md:hidden h-20" />
        </main>
    );
}