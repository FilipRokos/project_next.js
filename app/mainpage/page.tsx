"use client";

import { useSession, signOut } from "next-auth/react";
import { FaUser, FaCog, FaPlus, FaFileAlt, FaTimes } from "react-icons/fa";
import {useCallback, useEffect, useMemo, useState} from "react";
import { useRouter, usePathname } from "next/navigation";
import ImageDropUpload from "../../components/form/ImageDropUpload";
import CreateFolder from "@/components/form/CreateFolderForm";
import type {Folder} from "@/types/folders"
import ViewBox from "@/components/ViewBox";
import {File} from "@/types/file";

const cx = (...classes: Array<string | false | undefined>) =>
    classes.filter(Boolean).join(" ");

export default function MainPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [folders,setFolders] = useState<Folder[]>([]);
    const [files,setFiles] = useState<File[]>([]);
    const [currentParentId, setCurrentParentId] = useState("");
    const [path, setPath] = useState<{ id: string; name: string }[]>([
        { id: "", name: "user" },
    ]);

    const [refreshKey, setRefreshKey] = useState(0);
    useEffect(() => {
        if (status !== "loading" && !session) router.push("/");
    }, [status, session, router]);

    const handleFolderClick = (id: string, name: string) => {
        setCurrentParentId(id);

        setPath((prev) => {
            const index = prev.findIndex(p => p.id === id);

            if (index !== -1) {
                return prev.slice(0, index + 1);
            }

            return [...prev, { id, name }];
        });
    };
    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("/api/firestore/Folders/");
            const folders = await res.json();
            setFolders(folders.folders);
            const res2 = await fetch("/api/firestore/Files/");
            const files = await res2.json();
            setFiles(files.folders);

        };

        fetchData();
    }, [refreshKey]);
    const items = [
        ...folders
            .filter((f) => f.parentId === currentParentId)
            .map((folder) => ({
                id: folder.id,
                title: folder.name,
                type: "folder" as const,
            })),

        ...files
            .filter((f) => f.parentId === currentParentId)
            .map((file) => ({
                id: file.id,
                title: file.name,
                type: "file" as const,
                url: file.webViewLink,
            })),
    ];
    const navItems = useMemo(
        () => [
            { label: "Profil", icon: <FaUser size={18} />, href: "/mainpage/userinfo" },
            { label: "Nastavení", icon: <FaCog size={18} />, href: "/mainpage/settings" },
        ],
        []
    );

    /*if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-400 animate-pulse text-lg">Načítám session…</p>
            </div>
        );
    }*/
    if (!session) return null;

    const userName = session.user?.name ?? "Uživatel";
    const userEmail = session.user?.email ?? "";
    const initials = userName
        .split(" ")
        .slice(0, 2)
        .map((p: string) => p[0]?.toUpperCase())
        .join("");

    const userId = (session as any)?.user?.id as string;

    // @ts-ignore
    return (
        <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 text-gray-900">
            {/* Decorative blobs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
                <div className="blob blob-3" />
            </div>

            {/* Top Navbar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
                <div className="mx-auto max-w-7xl px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3 animate-in">
                        <div className="h-10 w-10 rounded-2xl bg-sky-100 flex items-center justify-center font-extrabold text-sky-700">
                            F
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-extrabold leading-tight">
                                Fill Out Later

                            </h1>
                            <p className="hidden md:block text-xs text-gray-500">
                                Správa složek & souborů
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="animate-in inline-flex items-center justify-center rounded-2xl bg-white border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 hover:shadow-sm active:scale-[0.98] transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Layout */}
            <div className="mx-auto max-w-7xl px-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="hidden md:block w-72 shrink-0 py-8 animate-in">
                        <div className="sticky top-24">
                            <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur shadow-sm p-4">
                                {/* User card */}
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 border border-gray-100">
                                    <div className="h-11 w-11 rounded-2xl bg-sky-100 flex items-center justify-center font-bold text-sky-700">
                                        {initials || "U"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{userName}</p>
                                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                                    </div>
                                </div>

                                {/* Nav */}
                                <div className="mt-4 space-y-1">
                                    {navItems.map((item) => {
                                        const active = pathname?.startsWith(item.href);
                                        return (
                                            <button
                                                key={item.href}
                                                onClick={() => router.push(item.href)}
                                                className={cx(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition text-sm",
                                                    active
                                                        ? "bg-sky-50/80 text-sky-700 border border-sky-100"
                                                        : "hover:bg-white/80 text-gray-700"
                                                )}
                                            >
                        <span
                            className={cx(
                                "h-9 w-9 rounded-xl flex items-center justify-center",
                                active ? "bg-white" : "bg-white/80 border border-gray-100"
                            )}
                        >
                          {item.icon}
                        </span>
                                                <span className="font-medium">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="my-4 h-px bg-gray-100" />

                                {/* Actions */}
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => setIsCreateFolderOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl px-3 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition shadow-sm active:scale-[0.98]">
                                        <FaPlus size={16} />
                                        Nová složka
                                    </button>

                                    <button
                                        onClick={() => setIsUploadOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl px-3 py-3 bg-white/80 hover:bg-white border border-gray-200 text-gray-800 font-semibold text-sm transition active:scale-[0.98]"
                                    >
                                        <FaFileAlt size={16} />
                                        Nový obrázek
                                    </button>
                                </div>

                                <p className="mt-3 text-xs text-gray-500 text-center">
                                    Tip: Přetáhni soubory do plochy.
                                </p>
                            </div>
                        </div>
                    </aside>
                    <ViewBox
                        path={path}
                        items={items}
                        onFolderClick={handleFolderClick}
                    />










                </div>
            </div>

            {/* Mobile bottom nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur border-t border-gray-200 shadow-sm">
                <div className="flex justify-around py-3">
                    <button
                        onClick={() => router.push("/mainpage/userinfo")}
                        className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-700"
                    >
                        <FaUser size={22} />
                    </button>
                    <button
                        onClick={() => router.push("/mainpage/settings")}
                        className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-700"
                    >
                        <FaCog size={22} />
                    </button>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="p-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition"
                    >
                        <FaPlus size={22} />
                    </button>
                </div>
            </nav>

            {/* ✅ Upload modal */}
            {isUploadOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onMouseDown={() => setIsUploadOpen(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white/90 shadow-xl p-5"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className=  "text-lg font-extrabold">Nahrát obrázek</h3>
                                <p className="text-sm text-gray-500">Přetáhni obrázek do boxu.</p>
                            </div>
                            <button
                                onClick={() => setIsUploadOpen(false)}
                                className="h-10 w-10 rounded-2xl border border-gray-200 bg-white/80 hover:bg-white flex items-center justify-center"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <ImageDropUpload
                            userId={userId}
                            path="/"
                            onClose={() => setIsUploadOpen(false)}
                            onUploaded={() => {

                            }}
                        />
                    </div>
                </div>
            )}
            {isCreateFolderOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onMouseDown={() => setIsCreateFolderOpen(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white/90 shadow-xl p-5"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className=  "text-lg font-extrabold">Nahrát obrázek</h3>
                                <p className="text-sm text-gray-500">Přetáhni obrázek do boxu.</p>
                            </div>
                            <button
                                onClick={() => setIsCreateFolderOpen(false)}
                                className="h-10 w-10 rounded-2xl border border-gray-200 bg-white/80 hover:bg-white flex items-center justify-center"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <CreateFolder
                            onClose={() => setIsUploadOpen(false)}
                            folders={folders}
                            onSubmit={()=> setRefreshKey(prev => prev + 1)}

                        />
                    </div>
                </div>
            )}

            {/* Animations + blobs */}
            <style jsx global>{`
                .animate-in {
                    animation: fadeUp 700ms ease-out both;
                }
                .animate-in-delay {
                    animation: fadeUp 900ms ease-out both;
                }
                @keyframes fadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .blob {
                    position: absolute;
                    width: 460px;
                    height: 460px;
                    max-width: 100vw;
                    border-radius: 9999px;
                    filter: blur(40px);
                    opacity: 0.35;
                    animation: floaty 10s ease-in-out infinite;
                    background: radial-gradient(circle at 30% 30%, #38bdf8, transparent 60%),
                    radial-gradient(circle at 70% 70%, #60a5fa, transparent 55%);
                }
                .blob-1 {
                    top: -180px;
                    left: -160px;
                }
                .blob-2 {
                    top: 120px;
                    right: -200px;
                    animation-duration: 12s;
                }
                .blob-3 {
                    bottom: -220px;
                    left: 25%;
                    animation-duration: 14s;
                }
                @keyframes floaty {
                    0%,
                    100% {
                        transform: translate3d(0, 0, 0) scale(1);
                    }
                    50% {
                        transform: translate3d(0, 18px, 0) scale(1.03);
                    }
                }
            `}</style>
        </div>
    );
}