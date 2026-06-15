"use client";

import { useState } from "react";
import { FaFolder, FaFolderOpen, FaChevronRight, FaFileImage } from "react-icons/fa";
import type { Folder } from "@/types/folders";
import type { File } from "@/types/file";

type Props = {
    folders: Folder[];
    files?: File[];
    currentId: string;
    onSelect: (id: string, name: string) => void;
};

type TreeNodeProps = {
    folder: Folder;
    folders: Folder[];
    files: File[];
    currentId: string;
    depth: number;
    onSelect: (id: string, name: string) => void;
};

function TreeNode({ folder, folders, files, currentId, depth, onSelect }: TreeNodeProps) {
    const childFolders = folders.filter((f) => f.parentId === folder.id);
    const childFiles = files.filter((f) => f.parentId === folder.id);
    const hasChildren = childFolders.length > 0 || childFiles.length > 0;
    const isActive = currentId === folder.id;
    const [open, setOpen] = useState(false);

    return (
        <div>
            <div
                className={`w-full flex items-center gap-1.5 py-1 rounded-lg text-xs transition group ${
                    isActive
                        ? "bg-indigo-50 text-indigo-600 font-semibold"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
                style={{ paddingLeft: `${6 + depth * 12}px` }}
            >
                {/* Šipka — jen rozbalí/sbalí */}
                <button
                    onClick={() => hasChildren && setOpen((v) => !v)}
                    className={`shrink-0 transition-transform duration-150 p-0.5 ${open ? "rotate-90" : ""} ${!hasChildren ? "opacity-0 pointer-events-none" : ""}`}
                >
                    <FaChevronRight size={8} />
                </button>

                {/* Název — naviguje */}
                <button
                    onClick={() => onSelect(folder.id, folder.name)}
                    className="flex items-center gap-1.5 flex-1 truncate text-left"
                >
                    {open && hasChildren
                        ? <FaFolderOpen size={11} className="shrink-0 text-amber-400" />
                        : <FaFolder size={11} className="shrink-0 text-amber-400" />
                    }
                    <span className="truncate">{folder.name}</span>
                </button>
            </div>

            {open && (
                <div>
                    {childFolders.map((child) => (
                        <TreeNode
                            key={child.id}
                            folder={child}
                            folders={folders}
                            files={files}
                            currentId={currentId}
                            depth={depth + 1}
                            onSelect={onSelect}
                        />
                    ))}
                    {childFiles.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center gap-1.5 py-1 text-xs text-gray-400 truncate"
                            style={{ paddingLeft: `${6 + (depth + 1) * 12}px` }}
                        >
                            <span className="opacity-0 w-2 shrink-0" />
                            <FaFileImage size={10} className="shrink-0 text-indigo-300" />
                            <span className="truncate">{file.fileName}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FolderTree({ folders, files = [], currentId, onSelect }: Props) {
    const roots = folders.filter((f) => !f.parentId || f.parentId === "");
    const rootFiles = files.filter((f) => !f.parentId || f.parentId === "");

    return (
        <div className="space-y-0.5">
            {roots.length === 0 && rootFiles.length === 0 && (
                <p className="text-xs text-gray-400 px-2 py-1">Prázdné</p>
            )}

            {roots.map((folder) => (
                <TreeNode
                    key={folder.id}
                    folder={folder}
                    folders={folders}
                    files={files}
                    currentId={currentId}
                    depth={0}
                    onSelect={onSelect}
                />
            ))}
            {rootFiles.map((file) => (
                <div
                    key={file.id}
                    className="flex items-center gap-1.5 py-1 px-1.5 text-xs text-gray-400 truncate"
                >
                    <span className="opacity-0 w-2 shrink-0" />
                    <FaFileImage size={10} className="shrink-0 text-indigo-300" />
                    <span className="truncate">{file.fileName}</span>
                </div>
            ))}
        </div>
    );
}
