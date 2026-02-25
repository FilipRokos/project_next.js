"use client";

import { useSession, signOut } from "next-auth/react";
import { FaUser, FaCog, FaPlus, FaFileAlt } from "react-icons/fa";
import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

const cx = (...classes: Array<string | false | undefined>) =>
    classes.filter(Boolean).join(" ");

export default function MainPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== "loading" && !session) router.push("/");
    }, [status, session, router]);

    const navItems = useMemo(
        () => [
            { label: "Profil", icon: <FaUser size={18} />, href: "/mainpage/userinfo" },
            { label: "Nastavení", icon: <FaCog size={18} />, href: "/mainpage/settings" },
        ],
        []
    );

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-400 animate-pulse text-lg">Načítám session…</p>
            </div>
        );
    }
    if (!session) return null;

    const userName = session.user?.name ?? "Uživatel";
    const userEmail = session.user?.email ?? "";
    const initials = userName
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");

    return (
        <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 text-gray-900">
            {/* Decorative blobs like Home */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
                <div className="blob blob-3" />
            </div>

            {/* Top Navbar (Home-like) */}
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

                                {/* Divider */}
                                <div className="my-4 h-px bg-gray-100" />

                                {/* Actions */}
                                <div className="grid grid-cols-1 gap-2">
                                    <button className="w-full flex items-center justify-center gap-2 rounded-2xl px-3 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition shadow-sm active:scale-[0.98]">
                                        <FaPlus size={16} />
                                        Nová složka
                                    </button>

                                    <button className="w-full flex items-center justify-center gap-2 rounded-2xl px-3 py-3 bg-white/80 hover:bg-white border border-gray-200 text-gray-800 font-semibold text-sm transition active:scale-[0.98]">
                                        <FaFileAlt size={16} />
                                        Nový soubor
                                    </button>
                                </div>

                                <p className="mt-3 text-xs text-gray-500 text-center">
                                    Tip: Přetáhni soubory do plochy.
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* Main */}
                    <main className="flex-1 py-8 animate-in-delay">
                        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur shadow-sm">
                            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg md:text-xl font-extrabold">Moje složky</h2>
                                    <p className="text-sm text-gray-500">
                                        Zde se budou zobrazovat složky a obrázky uživatele.
                                    </p>
                                </div>

                                {/* quick actions for smaller screens */}
                                <div className="md:hidden flex gap-2">
                                    <button className="bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-2xl text-sm font-semibold text-white transition shadow-sm active:scale-[0.98]">
                    <span className="inline-flex items-center gap-2">
                      <FaPlus />
                      Složka
                    </span>
                                    </button>
                                    <button className="bg-white/80 hover:bg-white border border-gray-200 px-4 py-2 rounded-2xl text-sm font-semibold text-gray-800 transition active:scale-[0.98]">
                    <span className="inline-flex items-center gap-2">
                      <FaFileAlt />
                      Soubor
                    </span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {[...Array(8)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="rounded-3xl border border-gray-200 bg-white/60 p-4 hover:bg-white hover:shadow-sm transition"
                                        >
                                            <div className="h-10 w-10 rounded-2xl bg-sky-100 mb-3" />
                                            <div className="h-4 w-2/3 bg-gray-200/60 rounded mb-2" />
                                            <div className="h-3 w-1/2 bg-gray-200/60 rounded" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* extra spacing for mobile bottom nav */}
                        <div className="md:hidden h-20" />
                    </main>
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
                    <button className="p-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition">
                        <FaPlus size={22} />
                    </button>
                </div>
            </nav>

            {/* Animations + blobs (same as Home, with overflow-safe sizing) */}
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