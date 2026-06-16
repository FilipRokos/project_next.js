"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaBell, FaLock, FaPalette, FaSave } from "react-icons/fa";

const cx = (...classes: Array<string | false | undefined>) =>
    classes.filter(Boolean).join(" ");

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={cx(
                "relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0",
                enabled ? "bg-emerald-600" : "bg-slate-200"
            )}
            aria-pressed={enabled}
        >
            <span
                className={cx(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm",
                    enabled ? "translate-x-6" : "translate-x-1"
                )}
            />
        </button>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return <div className="bg-white border border-slate-200 rounded-xl p-5">{children}</div>;
}

function SectionHead({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-400">{desc}</p>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(false);
    const [twoFactor, setTwoFactor] = useState(false);
    const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
    const [saving, setSaving] = useState(false);

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
    const userEmail = session.user?.email ?? "";

    const onSave = async () => {
        setSaving(true);
        try {
            await new Promise((r) => setTimeout(r, 600));
        } finally {
            setSaving(false);
        }
    };

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
                            <h1 className="text-sm font-semibold tracking-tight">Nastavení</h1>
                            <p className="hidden md:block text-[11px] text-slate-400">Účet, upozornění, zabezpečení a vzhled</p>
                        </div>
                    </div>

                    <button
                        onClick={onSave}
                        disabled={saving}
                        className={cx(
                            "px-4 py-1.5 rounded-md text-xs font-semibold text-white transition inline-flex items-center gap-2 shadow-sm",
                            saving ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                        )}
                    >
                        <FaSave size={12} />
                        {saving ? "Ukládám…" : "Uložit změny"}
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="mx-auto max-w-5xl px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Account */}
                    <Card>
                        <h2 className="text-sm font-semibold mb-4">Účet</h2>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="h-11 w-11 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-emerald-400">
                                {(userName?.split(" ")[0]?.[0] ?? "U").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{userName}</p>
                                <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Zobrazované jméno</label>
                                <input
                                    defaultValue={userName}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                                    placeholder="Např. Jan Novák"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Email</label>
                                <input
                                    defaultValue={userEmail}
                                    disabled
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
                                />
                                <p className="mt-1 text-[11px] text-slate-400">Email je spravovaný přes přihlášení (NextAuth).</p>
                            </div>
                        </div>
                    </Card>

                    {/* Right column */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Notifications */}
                        <Card>
                            <SectionHead icon={<FaBell size={13} />} title="Upozornění" desc="Nastav si, co ti máme posílat." />
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                                    <div>
                                        <p className="text-sm font-semibold">Emailová upozornění</p>
                                        <p className="text-xs text-slate-400">Nové soubory, sdílení, důležité změny.</p>
                                    </div>
                                    <Toggle enabled={emailNotifs} onChange={setEmailNotifs} />
                                </div>
                                <div className="flex items-center justify-between gap-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                                    <div>
                                        <p className="text-sm font-semibold">Push notifikace</p>
                                        <p className="text-xs text-slate-400">Upozornění v prohlížeči / mobilu.</p>
                                    </div>
                                    <Toggle enabled={pushNotifs} onChange={setPushNotifs} />
                                </div>
                            </div>
                        </Card>

                        {/* Security */}
                        <Card>
                            <SectionHead icon={<FaLock size={13} />} title="Zabezpečení" desc="Základní bezpečnostní nastavení." />
                            <div className="flex items-center justify-between gap-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                                <div>
                                    <p className="text-sm font-semibold">Dvoufázové ověření (2FA)</p>
                                    <p className="text-xs text-slate-400">Doporučeno pro lepší ochranu účtu.</p>
                                </div>
                                <Toggle enabled={twoFactor} onChange={setTwoFactor} />
                            </div>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <button className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold transition">
                                    Změnit heslo
                                </button>
                                <button className="rounded-lg border border-rose-200 bg-white hover:bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition">
                                    Odhlásit ostatní zařízení
                                </button>
                            </div>
                        </Card>

                        {/* Appearance */}
                        <Card>
                            <SectionHead icon={<FaPalette size={13} />} title="Vzhled" desc="Vyber si téma aplikace." />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {([
                                    { key: "system", label: "Systém" },
                                    { key: "light", label: "Světlé" },
                                    { key: "dark", label: "Tmavé" },
                                ] as const).map((t) => {
                                    const active = theme === t.key;
                                    return (
                                        <button
                                            key={t.key}
                                            onClick={() => setTheme(t.key)}
                                            className={cx(
                                                "p-3.5 rounded-lg border text-sm font-semibold transition text-left",
                                                active
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                            )}
                                        >
                                            {t.label}
                                            <div className={cx("mt-2 h-1.5 w-14 rounded-full", active ? "bg-emerald-300" : "bg-slate-200")} />
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="mt-3 text-[11px] text-slate-400">
                                Téma zatím jen UI state — napojíš na `next-themes` nebo vlastní řešení.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
