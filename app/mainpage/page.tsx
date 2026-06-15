"use client";

import { useSession, signOut } from "next-auth/react";
import { FaUser, FaCog, FaPlus, FaFileAlt, FaTimes, FaSignOutAlt, FaReceipt, FaFolder, FaHome } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import ImageDropUpload from "../../components/form/ImageDropUpload";
import CreateFolder from "@/components/form/CreateFolderForm";
import type { Folder } from "@/types/folders";
import ViewBox from "@/components/ViewBox";
import FolderTree from "@/components/FolderTree";
import { File } from "@/types/file";

const cx = (...classes: Array<string | false | undefined>) =>
    classes.filter(Boolean).join(" ");

export default function MainPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [currentParentId, setCurrentParentId] = useState("");
    const [path, setPath] = useState<{ id: string; name: string }[]>([
        { id: "", name: "Domů" },
    ]);
    const lastId = path.length > 0 ? path[path.length - 1].id : "";
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (status !== "loading" && !session) router.push("/");
    }, [status, session, router]);

    const buildFullPath = (folderId: string): { id: string; name: string }[] => {
        const result: { id: string; name: string }[] = [];
        let current = folders.find((f) => f.id === folderId);
        while (current) {
            result.unshift({ id: current.id, name: current.name });
            current = current.parentId ? folders.find((f) => f.id === current!.parentId) : undefined;
        }
        return [{ id: "", name: "Domů" }, ...result];
    };

    const handleFolderClick = (id: string, name: string) => {
        setCurrentParentId(id);
        if (id === "") {
            setPath([{ id: "", name: "Domů" }]);
            return;
        }
        // Pokud je složka v aktuální path, ořež na ni
        setPath((prev) => {
            const index = prev.findIndex((p) => p.id === id);
            if (index !== -1) return prev.slice(0, index + 1);
            // Jinak sestav celou cestu od rootu
            return buildFullPath(id);
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("/api/firestore/Folders/");
            const foldersData = await res.json();
            setFolders(foldersData.folders);
            const res2 = await fetch("/api/firestore/Files/");
            const filesData = await res2.json();
            setFiles(filesData.folders);
        };
        fetchData();
    }, [refreshKey]);

    const items = [
        ...folders
            .filter((f) => f.parentId === currentParentId)
            .map((folder) => ({ id: folder.id, title: folder.name, type: "folder" as const })),
        ...files
            .filter((f) => f.parentId === currentParentId)
            .map((file) => ({ id: file.id, title: file.fileName, type: "file" as const, url: file.webViewLink })),
    ];

    const navItems = useMemo(() => [
        { label: "Profil", icon: <FaUser size={13} />, href: "/mainpage/userinfo" },
        { label: "Nastavení", icon: <FaCog size={13} />, href: "/mainpage/settings" },
    ], []);

    if (!session) return null;

    const userName = session.user?.name ?? "Uživatel";
    const userEmail = session.user?.email ?? "";
    const initials = userName.split(" ").slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join("");
    const userId = (session as any)?.user?.id as string;

    const totalFolders = folders.length;
    const totalFiles = files.length;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex">

            {/* ── Sidebar ── */}
            <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white fixed h-full z-30">
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-4 h-16 border-b border-gray-100 shrink-0">
                    <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                        <FaReceipt size={13} className="text-white" />
                    </div>
                    <span className="font-bold text-sm text-gray-900">DigiReceipts</span>
                </div>

                {/* Nav */}
                <nav className="p-2.5 space-y-0.5 border-b border-gray-100">
                    <button
                        onClick={() => handleFolderClick("", "Domů")}
                        className={cx(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition",
                            currentParentId === "" && pathname === "/mainpage"
                                ? "bg-indigo-50 text-indigo-600 font-semibold"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        )}
                    >
                        <FaHome size={13} />
                        <span>Domů</span>
                    </button>
                    {navItems.map((item) => {
                        const active = pathname === item.href || (item.href !== "/mainpage" && pathname?.startsWith(item.href));
                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className={cx(
                                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition",
                                    active
                                        ? "bg-indigo-50 text-indigo-600 font-semibold"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Folder + file tree */}
                <div className="flex-1 overflow-y-auto p-2.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1">Průzkumník</p>
                    <FolderTree
                        folders={folders}
                        files={files}
                        currentId={currentParentId}
                        onSelect={(id, name) => handleFolderClick(id, name)}
                    />
                </div>

                {/* Stats */}
                <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 grid grid-cols-2 gap-2">
                        <div className="text-center">
                            <p className="text-lg font-black text-gray-900">{totalFolders}</p>
                            <p className="text-xs text-gray-400">Složky</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-gray-900">{totalFiles}</p>
                            <p className="text-xs text-gray-400">Soubory</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-2.5 border-t border-gray-100 space-y-1.5">
                    <button
                        onClick={() => setIsCreateFolderOpen(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white transition"
                    >
                        <FaPlus size={11} />
                        Nová složka
                    </button>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 transition"
                    >
                        <FaFileAlt size={11} />
                        Nahrát účtenku
                    </button>
                </div>

                {/* User */}
                <div className="p-2.5 border-t border-gray-100 shrink-0">
                    <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                            {initials || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-900 truncate">{userName}</p>
                            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                            title="Odhlásit se"
                        >
                            <FaSignOutAlt size={12} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col min-h-screen md:ml-56">

                {/* Mobile header */}
                <header className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-14 border-b border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <FaReceipt size={12} className="text-white" />
                        </div>
                        <span className="font-bold text-sm">DigiReceipts</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCreateFolderOpen(true)}
                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                        >
                            <FaFolder size={14} />
                        </button>
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition"
                        >
                            <FaPlus size={11} />
                            Nahrát
                        </button>
                    </div>
                </header>

                {/* Desktop content header */}
                <div className="hidden md:flex items-center justify-between px-6 h-16 border-b border-gray-100 bg-white shrink-0">
                    <div>
                        <h1 className="text-sm font-bold text-gray-900">Moje účtenky</h1>
                        <p className="text-xs text-gray-400">{totalFolders} složek · {totalFiles} souborů</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCreateFolderOpen(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition"
                        >
                            <FaFolder size={11} />
                            Složka
                        </button>
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition"
                        >
                            <FaPlus size={11} />
                            Nahrát účtenku
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-6">
                    <ViewBox
                        path={path}
                        items={items}
                        onFolderClick={handleFolderClick}
                    />
                </div>
            </div>

            {/* Mobile bottom nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white z-40">
                <div className="flex justify-around py-2">
                    <button
                        onClick={() => router.push("/mainpage")}
                        className={cx("flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition text-xs",
                            pathname === "/mainpage" ? "text-indigo-600" : "text-gray-400")}
                    >
                        <FaHome size={18} />
                        <span>Domů</span>
                    </button>
                    <button
                        onClick={() => router.push("/mainpage/userinfo")}
                        className={cx("flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition text-xs",
                            pathname?.startsWith("/mainpage/userinfo") ? "text-indigo-600" : "text-gray-400")}
                    >
                        <FaUser size={18} />
                        <span>Profil</span>
                    </button>
                    <button
                        onClick={() => router.push("/mainpage/settings")}
                        className={cx("flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition text-xs",
                            pathname?.startsWith("/mainpage/settings") ? "text-indigo-600" : "text-gray-400")}
                    >
                        <FaCog size={18} />
                        <span>Nastavení</span>
                    </button>
                </div>
            </nav>

            {/* Upload modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={() => setIsUploadOpen(false)}>
                    <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl p-6" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Nahrát účtenku</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Vyfoť nebo přetáhni obrázek.</p>
                            </div>
                            <button onClick={() => setIsUploadOpen(false)} className="h-8 w-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-700 transition">
                                <FaTimes size={12} />
                            </button>
                        </div>
                        <ImageDropUpload userId={userId} path="/" onClose={() => setIsUploadOpen(false)} onUploaded={() => setRefreshKey((p) => p + 1)} parentId={lastId} />
                    </div>
                </div>
            )}

            {/* Create folder modal */}
            {isCreateFolderOpen && (
                <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={() => setIsCreateFolderOpen(false)}>
                    <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl p-6" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Nová složka</h3>
                                <p className="text-sm text-gray-400 mt-0.5">Vytvoř novou složku.</p>
                            </div>
                            <button onClick={() => setIsCreateFolderOpen(false)} className="h-8 w-8 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-700 transition">
                                <FaTimes size={12} />
                            </button>
                        </div>
                        <CreateFolder onClose={() => setIsCreateFolderOpen(false)} folders={folders} onSubmit={() => setRefreshKey((p) => p + 1)} />
                    </div>
                </div>
            )}
        </div>
    );
}
