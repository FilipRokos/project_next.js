"use client";

import { signIn, useSession } from "next-auth/react";
import React from "react";

export default function Home() {
    const { status } = useSession();

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

            {/* Subtle grid */}
            <div className="pointer-events-none fixed inset-0 -z-0"
                style={{
                    backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                }}
            />

            {/* Top glow */}
            <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-indigo-100 blur-[80px] -z-0 opacity-70" />

            {/* Nav */}
            <header className="relative z-10 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0">
                <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-sm font-black text-white">
                            F
                        </div>
                        <span className="font-bold text-gray-900">DigiReceipts</span>
                    </div>
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/mainpage" })}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white  transition shadow-lg shadow-indigo-200"
                    >
                        <GoogleIcon />
                        Přihlásit se
                    </button>
                </div>
            </header>

            {/* Hero */}
            <main className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs text-indigo-600 font-medium mb-8">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Bez hesla · Přihlášení přes Google
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6 text-gray-900">
                    Ulož si to.
                    <br />
                    <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                        Vyplň později.
                    </span>
                </h1>

                <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
                    Složky, soubory a obrázky na jednom místě. Přehledně, rychle a bez zbytečností.
                </p>

                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/mainpage" })}
                        className="inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition shadow-lg shadow-indigo-200"
                    >
                        <GoogleIcon />
                        Začít zdarma
                    </button>
                    <a
                        href="#features"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3 text-sm font-semibold text-gray-700 transition"
                    >
                        Jak to funguje
                    </a>
                </div>

                {/* App preview mockup */}
                <div className="mt-16 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xl shadow-gray-100 text-left">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                        <div className="ml-4 h-5 w-48 rounded-md bg-gray-200" />
                    </div>
                    <div className="flex">
                        <div className="w-44 shrink-0 border-r border-gray-100 bg-gray-50/80 p-3 space-y-1">
                            {["Domů", "Složky", "Soubory", "Nastavení"].map((item, i) => (
                                <div key={item} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium ${i === 0 ? "bg-indigo-600 text-white" : "text-gray-400"}`}>
                                    <div className={`h-2.5 w-2.5 rounded-sm ${i === 0 ? "bg-white/40" : "bg-gray-300"}`} />
                                    {item}
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 p-5 bg-white">
                            <div className="grid grid-cols-3 gap-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                        <div className="h-8 w-8 rounded-lg bg-indigo-100 mb-2" />
                                        <div className="h-2.5 w-2/3 rounded-full bg-gray-200 mb-1.5" />
                                        <div className="h-2 w-1/2 rounded-full bg-gray-100" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features */}
            <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
                <div className="text-center mb-12">
                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-widest mb-3">Funkce</p>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900">Co ti to ulehčí</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { title: "Přehledné složky", desc: "Vše má svoje místo. Vytvoř si strukturu jak potřebuješ.", icon: "▤" },
                        { title: "Rychlé uložení", desc: "Pár kliků a soubor je uložený. Bez zbytečných kroků.", icon: "⚡" },
                        { title: "Google přihlášení", desc: "Bez registrace, bez hesla. Přihlásíš se přes Google.", icon: "🔑" },
                    ].map((f) => (
                        <div key={f.title} className="rounded-2xl border border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-indigo-50/30 p-6 transition group">
                            <div className="text-2xl mb-4">{f.icon}</div>
                            <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Steps */}
            <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 md:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-widest mb-3">Jak to funguje</p>
                            <h2 className="text-3xl font-black text-gray-900 mb-8">Tři kroky a jsi tam</h2>
                            <div className="space-y-5">
                                {[
                                    { n: "01", t: "Přihlas se přes Google", d: "Bez hesla, bezpečně, za pár sekund." },
                                    { n: "02", t: "Vytvoř složku nebo soubor", d: "Akce jsou přímo v sidebaru." },
                                    { n: "03", t: "Ukládej a vrať se", d: "Všechno na jednom místě, kdykoliv." },
                                ].map((s) => (
                                    <div key={s.n} className="flex items-start gap-4">
                                        <span className="text-xs font-black text-indigo-500 mt-0.5 w-6 shrink-0">{s.n}</span>
                                        <div>
                                            <p className="font-semibold text-gray-900">{s.t}</p>
                                            <p className="text-sm text-gray-500 mt-0.5">{s.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            {[
                                ["Formuláře", "vyplním později"],
                                ["Dokumenty", "projdu později"],
                                ["Screenshots", "zpracuju později"],
                                ["Inspirace", "vrátím se k tomu"],
                            ].map(([t, d]) => (
                                <div key={t} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                                    <span className="text-sm font-semibold text-gray-800">{t}</span>
                                    <span className="text-xs text-gray-400">{d}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
                <div className="rounded-2xl bg-indigo-600 p-10 md:p-16 text-center relative overflow-hidden transition shadow-lg shadow-indigo-200">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent" />
                    <h2 className="relative text-3xl md:text-4xl font-black text-white mb-3">Připraven začít?</h2>
                    <p className="relative text-indigo-200 mb-8">Přihlášení zabere pár sekund.</p>
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/mainpage" })}
                        className="relative inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition shadow-xl "
                    >
                        <GoogleIcon />
                        Přihlásit se přes Google
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-gray-100">
                <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-sm text-gray-400">
                    <span><span className="text-gray-700 font-semibold">DigiReceipts</span> · ukládej věci na později</span>
                    <span>© {new Date().getFullYear()}</span>
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
