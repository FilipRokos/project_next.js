"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    FaArrowLeft,
    FaGoogle,
    FaShieldAlt,
    FaUserCircle,
    FaSignOutAlt,
} from "react-icons/fa";

const cx = (...classes: Array<string | false | undefined>) =>
    classes.filter(Boolean).join(" ");

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-6 py-3 border-b border-gray-100 last:border-b-0">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-gray-800 text-right break-all">
                {value}
            </p>
        </div>
    );
}

export default function AccountPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== "loading" && !session) router.push("/");
    }, [status, session, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-400 animate-pulse text-lg">Načítám…</p>
            </div>
        );
    }
    if (!session) return null;

    const userName = session.user?.name ?? "Uživatel";
    const userEmail = session.user?.email ?? "—";
    const userImage = session.user?.image ?? "";
    const initials = userName
        .split(" ")
        .slice(0, 2)
        .map((p:string) => p[0]?.toUpperCase())
        .join("");

    // NextAuth session obvykle neobsahuje provider přímo.
    // UI říkáme "Google login" podle tvého použití.
    const providerLabel = "Google";
    const createdLabel = "Spravováno přes Google účet";

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            {/* Top bar */}
            <header className="bg-white/90 backdrop-blur border-b border-gray-200">
                <div className="mx-auto max-w-7xl px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/mainpage")}
                            className="p-2 rounded-xl hover:bg-gray-100 transition"
                            aria-label="Zpět"
                        >
                            <FaArrowLeft size={16} />
                        </button>

                        <div>
                            <h1 className="text-xl md:text-2xl font-bold leading-tight">
                                Účet
                            </h1>
                            <p className="hidden md:block text-xs text-gray-500">
                                Profil a přihlášení přes {providerLabel}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-xl text-sm font-semibold text-white transition shadow-sm inline-flex items-center gap-2"
                    >
                        <FaSignOutAlt size={14} />
                        Odhlásit
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile card */}
                    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-4">Profil</h2>

                        <div className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 border border-gray-100">
                            <div className="h-14 w-14 rounded-3xl bg-sky-100 flex items-center justify-center overflow-hidden">
                                {userImage ? (
                                    // nepoužívám next/image aby to bylo plug&play (domény apod.)
                                    // klidně to pak přepni na next/image
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={userImage}
                                        alt="Avatar"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="font-bold text-sky-700">{initials || "U"}</span>
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="text-base font-bold truncate">{userName}</p>
                                <p className="text-sm text-gray-500 truncate">{userEmail}</p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <button
                                onClick={() => router.push("/mainpage/settings")}
                                className="w-full rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-semibold transition"
                            >
                                Otevřít nastavení
                            </button>

                            <button
                                onClick={() => router.push("/mainpage")}
                                className="w-full rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-semibold transition"
                            >
                                Zpět na hlavní stránku
                            </button>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Account details */}
                        <section className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700">
                                    <FaUserCircle />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Detaily účtu</h3>
                                    <p className="text-sm text-gray-500">
                                        Tyto údaje pochází z přihlášení přes Google.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                <InfoRow label="Jméno" value={userName} />
                                <InfoRow label="Email" value={userEmail} />
                                <InfoRow label="Přihlášení" value={`${providerLabel} OAuth`} />
                                <InfoRow label="Správa účtu" value={createdLabel} />
                            </div>

                            <p className="mt-3 text-xs text-gray-500">
                                Pokud chceš změnit jméno/fotku, uprav to ve svém Google účtu – tady se to potom automaticky projeví.
                            </p>
                        </section>

                        {/* Security */}
                        <section className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700">
                                    <FaShieldAlt />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Bezpečnost</h3>
                                    <p className="text-sm text-gray-500">
                                        Doporučení pro bezpečné používání.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <FaGoogle className="text-sky-700" />
                                        Google účet
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Přístup spravuje Google. Doporučuji zapnout 2FA v Google účtu.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                    <div className="text-sm font-semibold">Odhlášení</div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Odhlásí tě z aplikace. Google účet zůstává přihlášený v prohlížeči dle nastavení.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => signOut()}
                                    className="rounded-2xl bg-sky-500 hover:bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition shadow-sm"
                                >
                                    Odhlásit z aplikace
                                </button>

                                <button
                                    onClick={() => router.push("/mainpage/settings")}
                                    className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-semibold transition"
                                >
                                    Upozornění a vzhled
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}