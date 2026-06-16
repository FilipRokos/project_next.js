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

// Animuje číslo od 0 k cílové hodnotě (fintech delight u statistik)
function useCountUp(target: number, duration = 600) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        let raf = 0;
        const start = performance.now();
        const from = 0;
        const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            setValue(Math.round(from + (target - from) * eased));
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return value;
}

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
    const [loading, setLoading] = useState(true);

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
        setPath((prev) => {
            const index = prev.findIndex((p) => p.id === id);
            if (index !== -1) return prev.slice(0, index + 1);
            return buildFullPath(id);
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/firestore/Folders/");
                const foldersData = await res.json();
                setFolders(foldersData.folders);
                const res2 = await fetch("/api/firestore/Files/");
                const filesData = await res2.json();
                setFiles(filesData.folders);
            } finally {
                setLoading(false);
            }
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

    const totalFolders = folders.length;
    const totalFiles = files.length;
    const animatedFolders = useCountUp(totalFolders);
    const animatedFiles = useCountUp(totalFiles);

    if (!session) return null;

    const userName = session.user?.name ?? "Uživatel";
    const userEmail = session.user?.email ?? "";
    const initials = userName.split(" ").slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join("");
    const userId = (session as any)?.user?.id as string;

    const currentName = path[path.length - 1]?.name ?? "Domů";

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex">

            {/* ── Sidebar ── */}
            <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white fixed h-full z-30">
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-200 shrink-0">
                    <div className="h-7 w-7 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
                        <FaReceipt size={12} className="text-emerald-400" />
                    </div>
                    <span className="font-semibold tracking-tight text-sm text-slate-900">DigiReceipts</span>
                </div>

                {/* Nav */}
                <nav className="p-2 space-y-0.5 border-b border-slate-200">
                    <button
                        onClick={() => handleFolderClick("", "Domů")}
                        className={cx(
                            "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition",
                            currentParentId === "" && pathname === "/mainpage"
                                ? "bg-emerald-50 text-emerald-700 font-semibold"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
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
                                    "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition",
                                    active
                                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Explorer */}
                <div className="flex-1 overflow-y-auto p-2 scroll-thin">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1.5 mb-1">Průzkumník</p>
                    <FolderTree
                        folders={folders}
                        files={files}
                        currentId={currentParentId}
                        onSelect={(id, name) => handleFolderClick(id, name)}
                    />
                </div>

                {/* Stats */}
                <div className="px-2 pb-2 border-t border-slate-200 pt-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 grid grid-cols-2 divide-x divide-slate-200">
                        <div className="px-3 py-2 text-center">
                            <p className="text-base font-bold text-slate-900 tnum">{animatedFolders}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Složky</p>
                        </div>
                        <div className="px-3 py-2 text-center">
                            <p className="text-base font-bold text-slate-900 tnum">{animatedFiles}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Soubory</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-2 border-t border-slate-200 space-y-1.5">
                    <button
                        onClick={() => setIsCreateFolderOpen(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition"
                    >
                        <FaFolder size={11} className="text-emerald-500" />
                        Nová složka
                    </button>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition shadow-sm"
                    >
                        <FaPlus size={11} />
                        Nahrát účtenku
                    </button>
                </div>

                {/* User */}
                <div className="p-2 border-t border-slate-200 shrink-0">
                    <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
                        <div className="h-8 w-8 rounded-md bg-slate-900 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                            {initials || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 truncate">{userName}</p>
                            <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                            title="Odhlásit se"
                        >
                            <FaSignOutAlt size={12} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col min-h-screen md:ml-60">

                {/* Mobile header */}
                <header className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-12 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-slate-900 flex items-center justify-center">
                            <FaReceipt size={11} className="text-emerald-400" />
                        </div>
                        <span className="font-semibold text-sm tracking-tight">DigiReceipts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setIsCreateFolderOpen(true)}
                            className="p-2 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                        >
                            <FaFolder size={13} />
                        </button>
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition"
                        >
                            <FaPlus size={10} />
                            Nahrát
                        </button>
                    </div>
                </header>

                {/* Desktop content header */}
                <div className="hidden md:flex items-center justify-between px-6 h-14 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20">
                    <div>
                        <h1 className="text-sm font-semibold text-slate-900 tracking-tight">{currentName}</h1>
                        <p className="text-[11px] text-slate-400 tnum">{totalFolders} složek · {totalFiles} souborů</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCreateFolderOpen(true)}
                            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition"
                        >
                            <FaFolder size={10} className="text-emerald-500" />
                            Složka
                        </button>
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm"
                        >
                            <FaPlus size={10} />
                            Nahrát účtenku
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-6">
                    <ViewBox
                        path={path}
                        items={items}
                        loading={loading}
                        onFolderClick={handleFolderClick}
                    />
                </div>
            </div>

            {/* Mobile bottom nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white z-40">
                <div className="flex justify-around py-1.5">
                    <button
                        onClick={() => router.push("/mainpage")}
                        className={cx("flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-md transition text-[10px] font-medium",
                            pathname === "/mainpage" ? "text-emerald-600" : "text-slate-400")}
                    >
                        <FaHome size={17} />
                        <span>Domů</span>
                    </button>
                    <button
                        onClick={() => router.push("/mainpage/userinfo")}
                        className={cx("flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-md transition text-[10px] font-medium",
                            pathname?.startsWith("/mainpage/userinfo") ? "text-emerald-600" : "text-slate-400")}
                    >
                        <FaUser size={17} />
                        <span>Profil</span>
                    </button>
                    <button
                        onClick={() => router.push("/mainpage/settings")}
                        className={cx("flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-md transition text-[10px] font-medium",
                            pathname?.startsWith("/mainpage/settings") ? "text-emerald-600" : "text-slate-400")}
                    >
                        <FaCog size={17} />
                        <span>Nastavení</span>
                    </button>
                </div>
            </nav>

            {/* Upload modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={() => setIsUploadOpen(false)}>
                    <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl p-5 fade-in-up" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Nahrát účtenku</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Vyfoť nebo přetáhni obrázek.</p>
                            </div>
                            <button onClick={() => setIsUploadOpen(false)} className="h-8 w-8 rounded-md border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
                                <FaTimes size={12} />
                            </button>
                        </div>
                        <ImageDropUpload userId={userId} path="/" onClose={() => setIsUploadOpen(false)} onUploaded={() => setRefreshKey((p) => p + 1)} parentId={lastId} />
                    </div>
                </div>
            )}

            {/* Create folder modal */}
            {isCreateFolderOpen && (
                <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={() => setIsCreateFolderOpen(false)}>
                    <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl p-5 fade-in-up" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Nová složka</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Vytvoř novou složku.</p>
                            </div>
                            <button onClick={() => setIsCreateFolderOpen(false)} className="h-8 w-8 rounded-md border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
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
