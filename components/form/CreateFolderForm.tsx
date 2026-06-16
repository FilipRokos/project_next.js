"use client";

import { useState } from "react";
import type { Folder } from "@/types/folders";
import { FaFolder, FaChevronRight } from "react-icons/fa";

type Props = {
    onClose: () => void;
    folders: Folder[];
    onSubmit: () => void;
};

function buildPath(folderId: string, folders: Folder[]): string {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return "/";
    if (!folder.parentId || folder.parentId === "") return `/${folder.name}`;
    return `${buildPath(folder.parentId, folders)}/${folder.name}`;
}

type TreeSelectNodeProps = {
    folder: Folder;
    folders: Folder[];
    depth: number;
    selectedId: string;
    onSelect: (id: string) => void;
};

function TreeSelectNode({ folder, folders, depth, selectedId, onSelect }: TreeSelectNodeProps) {
    const children = folders.filter((f) => f.parentId === folder.id);
    const [open, setOpen] = useState(false);
    const isSelected = selectedId === folder.id;

    return (
        <div>
            <div className="flex items-center">
                <button
                    type="button"
                    onClick={() => children.length > 0 && setOpen((v) => !v)}
                    className="p-1 text-slate-300 hover:text-slate-500"
                    style={{ paddingLeft: `${4 + depth * 12}px` }}
                >
                    {children.length > 0
                        ? <FaChevronRight size={8} className={`transition-transform ${open ? "rotate-90" : ""}`} />
                        : <span className="w-2 inline-block" />
                    }
                </button>
                <button
                    type="button"
                    onClick={() => onSelect(folder.id)}
                    className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition text-left ${
                        isSelected
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "hover:bg-slate-50 text-slate-700"
                    }`}
                >
                    <FaFolder size={11} className="text-amber-400 shrink-0" />
                    <span className="truncate">{folder.name}</span>
                </button>
            </div>

            {open && children.map((child) => (
                <TreeSelectNode
                    key={child.id}
                    folder={child}
                    folders={folders}
                    depth={depth + 1}
                    selectedId={selectedId}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}

export default function CreateFolderForm({ onClose, folders = [], onSubmit }: Props) {
    const [folderName, setFolderName] = useState("");
    const [parentId, setParentId] = useState<string>("");

    const roots = folders.filter((f) => !f.parentId || f.parentId === "");
    const selectedPath = parentId ? buildPath(parentId, folders) : "/";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!folderName.trim()) return alert("Zadej název složky.");
        if (folderName.trim().length > 100) return alert("Název může mít maximálně 100 znaků.");

        const formData = new FormData();
        formData.append("name", folderName);
        formData.append("parentId", parentId);
        formData.append("parentPath", selectedPath);

        await fetch("/api/firestore/Folders/", {
            method: "POST",
            body: formData,
        });

        onSubmit();
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Folder name */}
            <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Název složky</label>
                <input
                    type="text"
                    placeholder="Např. Únor 2025"
                    value={folderName}
                    maxLength={100}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="w-full border border-slate-200 bg-white px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                    autoFocus
                />
            </div>

            {/* Parent folder select */}
            <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Umístění</label>

                <div className="flex items-center gap-1 text-xs text-slate-500 mb-2 flex-wrap">
                    <span className="font-medium text-slate-600">Cesta:</span>
                    {selectedPath.split("/").filter(Boolean).length === 0
                        ? <span className="text-emerald-600 font-semibold">/ (kořen)</span>
                        : selectedPath.split("/").filter(Boolean).map((part, i, arr) => (
                            <span key={i} className="flex items-center gap-1">
                                <FaChevronRight size={7} className="text-slate-300" />
                                <span className={i === arr.length - 1 ? "text-emerald-600 font-semibold" : ""}>{part}</span>
                            </span>
                        ))
                    }
                </div>

                <div className="border border-slate-200 rounded-lg overflow-auto max-h-40 p-1.5 bg-slate-50 scroll-thin">
                    <button
                        type="button"
                        onClick={() => setParentId("")}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition text-left ${
                            parentId === ""
                                ? "bg-emerald-50 text-emerald-700 font-semibold"
                                : "hover:bg-white text-slate-500"
                        }`}
                    >
                        <FaFolder size={11} className="text-slate-400 shrink-0" />
                        / (kořen)
                    </button>

                    {roots.map((folder) => (
                        <TreeSelectNode
                            key={folder.id}
                            folder={folder}
                            folders={folders}
                            depth={0}
                            selectedId={parentId}
                            onSelect={setParentId}
                        />
                    ))}
                </div>
            </div>

            {/* Actions */}
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
                    disabled={!folderName.trim()}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition disabled:opacity-50 shadow-sm"
                >
                    Vytvořit
                </button>
            </div>
        </form>
    );
}
