"use client";

import { signIn, useSession } from "next-auth/react";
import React from "react";

export default function Home() {
    const { status } = useSession();

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="h-5 w-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">

            {/* Nav */}
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
                <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-slate-900 flex items-center justify-center">
                            <span className="text-emerald-400 text-xs font-black">D</span>
                        </div>
                        <span className="font-semibold tracking-tight text-slate-900">DigiReceipts</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href="#features" className="hidden sm:inline-flex text-sm font-medium text-slate-500 hover:text-slate-900 transition px-3 py-2">
                            Funkce
                        </a>
                        <button
                            onClick={() => signIn("google", { callbackUrl: "/mainpage" })}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-white transition"
                        >
                            <GoogleIcon />
                            Přihlásit se
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <main className="mx-auto max-w-6xl px-6 pt-16 pb-16">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 mb-6">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Účtenky a doklady na jednom místě
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-slate-900">
                        Správa účtenek,<br />
                        <span className="text-slate-400">bez chaosu.</span>
                    </h1>

                    <p className="mt-5 text-lg text-slate-500 leading-relaxed max-w-xl">
                        Vyfoť účtenku, zařaď do složky a najdi ji kdykoliv později. Přehledně,
                        rychle a bezpečně — přihlášení přes Google, bez hesel.
                    </p>

                    <div className="mt-8 flex items-center gap-3">
                        <button
                            onClick={() => signIn("google", { callbackUrl: "/mainpage" })}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition shadow-sm"
                        >
                            <GoogleIcon />
                            Začít zdarma
                        </button>
                        <a
                            href="#features"
                            className="inline-flex items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition"
                        >
                            Jak to funguje
                        </a>
                    </div>
                </div>

                {/* Dashboard mockup */}
                <div className="mt-14 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {/* Window bar */}
                    <div className="flex items-center gap-2 px-4 h-10 border-b border-slate-100 bg-slate-50">
                        <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        <div className="ml-3 text-xs text-slate-400 font-medium">app.digireceipts.cz</div>
                    </div>

                    <div className="grid grid-cols-12">
                        {/* Sidebar */}
                        <div className="col-span-3 border-r border-slate-100 p-3 hidden md:block">
                            {[["Domů", true], ["Faktury", false], ["Účtenky", false], ["Archiv", false]].map(([label, active], i) => (
                                <div key={i} className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium mb-0.5 ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-400"}`}>
                                    <div className={`h-3 w-3 rounded-sm ${active ? "bg-emerald-500" : "bg-slate-200"}`} />
                                    {label}
                                </div>
                            ))}
                            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Celkem</p>
                                <p className="text-xl font-bold text-slate-900 tnum mt-0.5">128</p>
                                <p className="text-[10px] text-slate-400">dokumentů</p>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="col-span-12 md:col-span-9 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-7 w-40 rounded-md bg-slate-100" />
                                <div className="h-7 w-24 rounded-md bg-emerald-100" />
                            </div>
                            <div className="rounded-lg border border-slate-100 overflow-hidden">
                                {/* header */}
                                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                                    {["Název", "Složka", "Datum", "Velikost"].map((h, i) => (
                                        <div key={i} className={`text-[10px] uppercase tracking-wide font-semibold text-slate-400 ${i === 0 ? "col-span-5" : "col-span-2 col-start-auto"} ${i === 3 ? "col-span-3 text-right" : ""}`}>{h}</div>
                                    ))}
                                </div>
                                {/* rows */}
                                {[60, 45, 70, 50, 65].map((w, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-slate-50 items-center">
                                        <div className="col-span-5 flex items-center gap-2">
                                            <div className="h-6 w-6 rounded bg-emerald-50 border border-emerald-100" />
                                            <div className="h-2.5 rounded-full bg-slate-200" style={{ width: `${w}%` }} />
                                        </div>
                                        <div className="col-span-2 h-2.5 w-12 rounded-full bg-slate-100" />
                                        <div className="col-span-2 h-2.5 w-14 rounded-full bg-slate-100" />
                                        <div className="col-span-3 flex justify-end"><div className="h-2.5 w-10 rounded-full bg-slate-100" /></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Stats strip */}
            <section className="border-y border-slate-200 bg-white">
                <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-3 gap-6">
                    {[["100%", "Bez hesel"], ["< 5s", "Nahrání účtenky"], ["∞", "Složek a souborů"]].map(([n, l], i) => (
                        <div key={i} className="text-center">
                            <p className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 tnum">{n}</p>
                            <p className="text-xs text-slate-500 mt-1">{l}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section id="features" className="mx-auto max-w-6xl px-6 py-20">
                <div className="max-w-xl mb-12">
                    <p className="text-xs text-emerald-600 font-semibold uppercase tracking-widest mb-2">Funkce</p>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Vše co potřebuješ pro pořádek v dokladech</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
                    {[
                        { title: "Stromová struktura", desc: "Organizuj účtenky do složek a podsložek. Přehledný průzkumník jako v editoru." },
                        { title: "Foť z mobilu", desc: "Otevři nativní kameru telefonu, vyfoť účtenku a rovnou ji nahraj." },
                        { title: "Rychlé vyhledání", desc: "Náhledy, lightbox a stažení jedním klikem. Nic se neztratí." },
                        { title: "Google přihlášení", desc: "Žádná registrace ani hesla. Bezpečné OAuth přihlášení přes Google." },
                        { title: "Cloudové úložiště", desc: "Soubory bezpečně uložené, dostupné odkudkoliv a kdykoliv." },
                        { title: "Bez instalace", desc: "Funguje v prohlížeči na počítači i v mobilu. Stačí se přihlásit." },
                    ].map((f) => (
                        <div key={f.title} className="bg-white p-6 hover:bg-slate-50 transition">
                            <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                                <div className="h-3.5 w-3.5 rounded-sm bg-emerald-500" />
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-6xl px-6 pb-20">
                <div className="rounded-2xl bg-slate-900 px-8 py-14 md:px-14 text-center relative overflow-hidden">
                    <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-emerald-500/20 blur-[100px]" />
                    <h2 className="relative text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
                        Začni mít pořádek v účtenkách
                    </h2>
                    <p className="relative text-slate-400 mb-8 max-w-md mx-auto">
                        Přihlášení zabere pár sekund. Žádná kreditka, žádná instalace.
                    </p>
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/mainpage" })}
                        className="relative inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition shadow-lg shadow-emerald-900/40"
                    >
                        <GoogleIcon />
                        Přihlásit se přes Google
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded bg-slate-900 flex items-center justify-center">
                            <span className="text-emerald-400 text-[9px] font-black">D</span>
                        </div>
                        <span className="font-medium text-slate-600">DigiReceipts</span>
                    </div>
                    <span>© {new Date().getFullYear()} · Správa účtenek</span>
                </div>
            </footer>
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.4H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.2l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.6z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 19 12 24 12c3.1 0 5.9 1.2 8 3.2l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.4 35.1 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.4H42V20H24v8h11.3c-1 2.6-2.8 4.8-5 6.3l6.3 5.2C39.7 36.6 44 31.4 44 24c0-1.3-.1-2.7-.4-3.6z" />
        </svg>
    );
}
