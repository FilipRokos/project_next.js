"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaGoogle, FaShieldAlt, FaUserCircle, FaSignOutAlt } from "react-icons/fa";

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-6 py-2.5 border-b border-slate-100 last:border-b-0">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-sm font-semibold text-slate-700 text-right break-all">{value}</p>
        </div>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return <div className="bg-white border border-slate-200 rounded-xl p-5">{children}</div>;
}

export default function AccountPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== "loading" && !session) router.push("/");
    }, [status, session, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="h-5 w-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            </div>
        );
    }
    if (!session) return null;

    const userName = session.user?.name ?? "Uživatel";
    const userEmail = session.user?.email ?? "—";
    const userImage = session.user?.image ?? "";
    const initials = userName.split(" ").slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join("");
    const providerLabel = "Google";
    const createdLabel = "Spravováno přes Google účet";

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Top bar */}
            <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
                <div className="mx-auto max-w-5xl px-6 h-14 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/mainpage")}
                            className="h-8 w-8 rounded-md border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition"
                            aria-label="Zpět"
                        >
                            <FaArrowLeft size={13} />
                        </button>
                        <div>
                            <h1 className="text-sm font-semibold tracking-tight">Účet</h1>
                            <p className="hidden md:block text-[11px] text-slate-400">Profil a přihlášení přes {providerLabel}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="px-4 py-1.5 rounded-md text-xs font-semibold text-white transition inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800"
                    >
                        <FaSignOutAlt size={12} />
                        Odhlásit
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="mx-auto max-w-5xl px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Profile card */}
                    <Card>
                        <h2 className="text-sm font-semibold mb-4">Profil</h2>
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="h-14 w-14 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
                                {userImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={userImage} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="font-bold text-emerald-400">{initials || "U"}</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-base font-bold truncate">{userName}</p>
                                <p className="text-sm text-slate-400 truncate">{userEmail}</p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2.5">
                            <button
                                onClick={() => router.push("/mainpage/settings")}
                                className="w-full rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold transition"
                            >
                                Otevřít nastavení
                            </button>
                            <button
                                onClick={() => router.push("/mainpage")}
                                className="w-full rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold transition"
                            >
                                Zpět na hlavní stránku
                            </button>
                        </div>
                    </Card>

                    {/* Details */}
                    <div className="lg:col-span-2 space-y-5">
                        <Card>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                    <FaUserCircle size={15} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">Detaily účtu</h3>
                                    <p className="text-xs text-slate-400">Tyto údaje pochází z přihlášení přes Google.</p>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <InfoRow label="Jméno" value={userName} />
                                <InfoRow label="Email" value={userEmail} />
                                <InfoRow label="Přihlášení" value={`${providerLabel} OAuth`} />
                                <InfoRow label="Správa účtu" value={createdLabel} />
                            </div>

                            <p className="mt-3 text-[11px] text-slate-400">
                                Pokud chceš změnit jméno/fotku, uprav to ve svém Google účtu — tady se to potom automaticky projeví.
                            </p>
                        </Card>

                        <Card>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                    <FaShieldAlt size={14} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">Bezpečnost</h3>
                                    <p className="text-xs text-slate-400">Doporučení pro bezpečné používání.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <FaGoogle className="text-emerald-600" />
                                        Google účet
                                    </div>
                                    <p className="mt-1 text-xs text-slate-400">Přístup spravuje Google. Doporučuji zapnout 2FA v Google účtu.</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-sm font-semibold">Odhlášení</div>
                                    <p className="mt-1 text-xs text-slate-400">Odhlásí tě z aplikace. Google účet zůstává přihlášený v prohlížeči dle nastavení.</p>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-col sm:flex-row gap-2.5">
                                <button
                                    onClick={() => signOut()}
                                    className="rounded-lg bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition"
                                >
                                    Odhlásit z aplikace
                                </button>
                                <button
                                    onClick={() => router.push("/mainpage/settings")}
                                    className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold transition"
                                >
                                    Upozornění a vzhled
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
