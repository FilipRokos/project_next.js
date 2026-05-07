"use client";

import { useState } from "react";
import type { Folder } from "@/types/folders";
import Select from "react-select";

type Props = {
    onClose: () => void;
    folders: Folder[];
    onSubmit: () => void;

};
export default function CreateFolderForm({
                                             onClose,
                                             folders = [],
                                             onSubmit
                                         }:Props) {
    const [folderName, setFolderName] = useState("");
    const [parent, setParent] = useState<{ id: string; path: string } | null>(null);
    const options = [
        {
            value: "",
            label: "/"
        },
        ...folders.map(f => ({
            value: f.id,
            label: f.path || f.name
        }))
    ];
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!folderName.trim()) return alert("Please enter a folder name.");
        const formData = new FormData();
        if(parent?.id === undefined) formData.append("parentPath", "/");
        else formData.append("parentPath", parent.path+"/");
        formData.append("name", folderName);
        formData.append("parentId", parent?.id || "");
        formData.append("parentPath", parent?.path || "/");
        const res = await fetch("/api/firestore/Folders/", {
            method: "POST",
            body: formData,

        })
        onSubmit();

    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            {/* FOLDER NAME */}
            <input
                type="text"
                placeholder="Název složky"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="border border-gray-200 bg-white/80 p-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-sky-200"
            />

            {/* PARENT SELECT */}
            <Select
                options={options}
                placeholder="Vyhledej složku..."
                isSearchable
                isClearable
                defaultValue={options[0]}
                onChange={(selected) => {
                    if (!selected || selected.value === "") {
                        setParent(null);
                        return;
                    }

                    setParent({
                        id: selected.value,
                        path: selected.label
                    });
                }}
            />

            {/* ACTIONS */}
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
                    disabled={!folderName.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition disabled:opacity-60"
                >
                    "Vytvořit složku"
                </button>
            </div>
        </form>
    );
}