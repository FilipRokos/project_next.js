"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaBell, FaLock, FaPalette, FaSave } from "react-icons/fa";

const cx = (...classes: Array<string | false | undefined>) =>
    classes.filter(Boolean).join(" ");

function Toggle({
                    enabled,
                    onChange,
                }: {
    enabled: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={cx(
                "relative inline-flex h-7 w-12 items-center rounded-full transition",
                enabled ? "bg-sky-500" : "bg-gray-200"
            )}
            aria-pressed={enabled}
        >
      <span
          className={cx(
              "inline-block h-5 w-5 transform rounded-full bg-white transition",
              enabled ? "translate-x-6" : "translate-x-1"
          )}
      />
        </button>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    // demo settings state
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-400 animate-pulse text-lg">Načítám…</p>
            </div>
        );
    }
    if (!session) return null;

    const userName = session.user?.name ?? "Uživatel";
    const userEmail = session.user?.email ?? "";

    const onSave = async () => {
        // TODO: napoj na API
        setSaving(true);
        try {
            await new Promise((r) => setTimeout(r, 600));
            // toast/snackbar si můžeš doplnit
        } finally {
            setSaving(false);
        }
    };

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
                                Nastavení
                            </h1>
                            <p className="hidden md:block text-xs text-gray-500">
                                Účet, upozornění, zabezpečení a vzhled
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onSave}
                        disabled={saving}
                        className={cx(
                            "px-4 py-2 rounded-xl text-sm font-semibold text-white transition shadow-sm inline-flex items-center gap-2",
                            saving ? "bg-sky-300 cursor-not-allowed" : "bg-sky-500 hover:bg-sky-600"
                        )}
                    >
                        <FaSave size={14} />
                        {saving ? "Ukládám…" : "Uložit změny"}
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Account card */}
                    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-4">Účet</h2>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="h-12 w-12 rounded-2xl bg-sky-100 flex items-center justify-center font-bold text-sky-700">
                                {(userName?.split(" ")[0]?.[0] ?? "U").toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold truncate">{userName}</p>
                                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Zobrazované jméno
                                </label>
                                <input
                                    defaultValue={userName}
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                                    placeholder="Např. Jan Novák"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <input
                                    defaultValue={userEmail}
                                    disabled
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Email je spravovaný přes přihlášení (NextAuth).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Settings cards */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Notifications */}
                        <section className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700">
                                    <FaBell />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Upozornění</h3>
                                    <p className="text-sm text-gray-500">
                                        Nastav si, co ti máme posílat.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div>
                                        <p className="font-semibold">Emailová upozornění</p>
                                        <p className="text-sm text-gray-500">
                                            Nové soubory, sdílení, důležité změny.
                                        </p>
                                    </div>
                                    <Toggle enabled={emailNotifs} onChange={setEmailNotifs} />
                                </div>

                                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div>
                                        <p className="font-semibold">Push notifikace</p>
                                        <p className="text-sm text-gray-500">
                                            Upozornění v prohlížeči / mobilu.
                                        </p>
                                    </div>
                                    <Toggle enabled={pushNotifs} onChange={setPushNotifs} />
                                </div>
                            </div>
                        </section>

                        {/* Security */}
                        <section className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700">
                                    <FaLock />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Zabezpečení</h3>
                                    <p className="text-sm text-gray-500">
                                        Základní bezpečnostní nastavení.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div>
                                    <p className="font-semibold">Dvoufázové ověření (2FA)</p>
                                    <p className="text-sm text-gray-500">
                                        Doporučeno pro lepší ochranu účtu.
                                    </p>
                                </div>
                                <Toggle enabled={twoFactor} onChange={setTwoFactor} />
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-3 text-sm font-semibold transition">
                                    Změnit heslo
                                </button>
                                <button className="rounded-2xl border border-red-200 bg-white hover:bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition">
                                    Odhlásit ostatní zařízení
                                </button>
                            </div>
                        </section>

                        {/* Appearance */}
                        <section className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700">
                                    <FaPalette />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Vzhled</h3>
                                    <p className="text-sm text-gray-500">
                                        Vyber si téma aplikace.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {(
                                    [
                                        { key: "system", label: "Systém" },
                                        { key: "light", label: "Světlé" },
                                        { key: "dark", label: "Tmavé" },
                                    ] as const
                                ).map((t) => {
                                    const active = theme === t.key;
                                    return (
                                        <button
                                            key={t.key}
                                            onClick={() => setTheme(t.key)}
                                            className={cx(
                                                "p-4 rounded-2xl border text-sm font-semibold transition text-left",
                                                active
                                                    ? "border-sky-200 bg-sky-50 text-sky-700"
                                                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                                            )}
                                        >
                                            {t.label}
                                            <div className="mt-2 h-2 w-16 rounded-full bg-gray-200" />
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="mt-3 text-xs text-gray-500">
                                Téma zatím jen UI state – napojíš na `next-themes` nebo vlastní řešení.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}