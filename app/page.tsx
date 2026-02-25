"use client";

import { signIn, useSession } from "next-auth/react";
import React, { JSX, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, type HTMLMotionProps } from "framer-motion";



type MotionTag = Extract<keyof JSX.IntrinsicElements, keyof typeof motion>;

type RevealProps<T extends MotionTag = "div"> = {
    as?: T;
    delay?: number;
    className?: string;
    amount?: number;
    margin?: string;
    y?: number;
    duration?: number;
    children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<(typeof motion)[T]>, "initial" | "animate" | "transition">;

export function Reveal<T extends MotionTag = "div">({
                                                        as,
                                                        delay = 0,
                                                        className = "",
                                                        amount = 0.12,
                                                        margin = "0px 0px -10% 0px",
                                                        y = 18,
                                                        duration = 0.65,
                                                        children,
                                                        ...rest
                                                    }: RevealProps<T>) {
    // useInView chce RefObject<Element | null>, motion komponenta chce konkrétnější typ.
    // Nejjednodušší: držet Element a při předání do ref udělat malý cast.
    const ref = useRef<HTMLElement | null>(null);
    //@ts-ignore
    const isInView = useInView(ref, { amount, margin });
    const MotionComp = useMemo(() => {
        const key = (as ?? "div") as MotionTag;
        return motion[key];
    }, [as]);
    //@ts-ignore
        return (
            <MotionComp
                ref={ref}
                className={["h-full", className].join(" ")}
                initial={false}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
                transition={{ duration, ease: "easeOut", delay: delay / 1000 }}
                {...rest}
            >
                {children}
            </MotionComp>
        );
}
export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // ✅ když je přihlášený, úvod se nezobrazí a hned přesměruje
    useEffect(() => {
        if (status !== "loading" && session) {
            router.replace("/mainpage");
        }
    }, [status, session, router]);

    // ✅ hard overflow fix globálně (často dělají bloby/absoluty)
    useEffect(() => {
        document.documentElement.style.overflowX = "hidden";
        document.body.style.overflowX = "hidden";
        return () => {
            document.documentElement.style.overflowX = "";
            document.body.style.overflowX = "";
        };
    }, []);

    const loginWhiteBtn =
        "inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 hover:shadow-sm transition";

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 animate-pulse">Načítám session…</p>
            </div>
        );
    }

    // ✅ aby to ani na moment nerenderovalo UI
    if (session) return null;

    return (
        <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 text-gray-900 relative">
            {/* ✅ Full-page blue tint (po celé stránce) */}
            <div className="pointer-events-none absolute inset-0 -z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50/70 via-transparent to-sky-100/60" />
            </div>

            {/* Decorative animated blobs (bez overflow) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
                <div className="blob blob-3" />
            </div>

            {/* Top bar */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
                <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-sky-100 flex items-center justify-center font-extrabold text-sky-700">
                            F
                        </div>
                        <div>
                            <p className="font-extrabold leading-tight">Fill Out Later</p>
                            <p className="text-xs text-gray-500 hidden sm:block">
                                Ulož a vrať se k tomu později.
                            </p>
                        </div>
                    </div>

                    {/* ✅ Login vpravo nahoře (bílý) */}
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/mainpage" })}
                        className={loginWhiteBtn}
                    >
                        <GoogleIcon />
                        Přihlásit se
                    </button>
                </div>
            </header>

            {/* HERO */}
            <main className="relative z-10 mx-auto max-w-7xl px-8 pt-14 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <Reveal className="" delay={0}>
                        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700">
                            <span className="h-2 w-2 rounded-full bg-sky-500" />
                            Přihlášení přes Google • bez hesla
                        </div>

                        <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
                            Ulož si to.
                            <span className="block text-sky-600">Vyplň později.</span>
                        </h1>

                        <p className="mt-5 text-lg text-gray-600 max-w-xl">
                            Složky, soubory a obrázky na jednom místě. Přehledně, rychle a bez
                            zbytečností. Ideální pro věci, které nechceš ztratit, ale teď na
                            ně není čas.
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row gap-3">
                            {/* ✅ Hero CTA taky bílé */}
                            <button
                                onClick={() => signIn("google", { callbackUrl: "/mainpage" })}
                                className={[loginWhiteBtn, "px-6 py-3.5 justify-center"].join(
                                    " "
                                )}
                            >
                                <GoogleIcon />
                                Začít s Google
                                <span className="inline-block transition-transform group-hover:translate-x-0.5">
                  →
                </span>
                            </button>

                            <a
                                href="#how"
                                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white/70 hover:bg-white px-6 py-3.5 text-sm font-semibold text-gray-900 transition"
                            >
                                Jak to funguje
                            </a>
                        </div>

                        {/* ✅ equal-height row cards */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 auto-rows-fr items-stretch">
                            <Reveal delay={50}>
                                <FeatureCard title="Složky" desc="Uspořádej si věci přehledně." />
                            </Reveal>
                            <Reveal delay={120}>
                                <FeatureCard title="Rychle" desc="Uložení na pár kliků." />
                            </Reveal>
                            <Reveal delay={190}>
                                <FeatureCard title="Bez hesla" desc="Google přihlášení." />
                            </Reveal>
                        </div>
                    </Reveal>

                    <Reveal delay={120}>
                        <PreviewPanel />
                    </Reveal>
                </div>
            </main>

            {/* SECTION: Features */}
            <section className="relative z-10 mx-auto max-w-7xl px-8 pb-16">
                <Reveal>
                    <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-6 md:p-10 shadow-sm">
                        <div className="flex items-end justify-between gap-6">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-extrabold">
                                    Co ti to ulehčí
                                </h2>
                                <p className="text-gray-600 mt-2 max-w-2xl">
                                    Minimalistická aplikace na ukládání věcí “na později” — ať už
                                    je to formulář, screenshot, dokument nebo inspirace.
                                </p>
                            </div>
                            <div className="hidden md:flex gap-2">
                                <Pill>Rychlé uložení</Pill>
                                <Pill>Čistý design</Pill>
                                <Pill>Desktop-first</Pill>
                            </div>
                        </div>

                        {/* ✅ equal-height cards across rows */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr items-stretch">
                            {[
                                ["Přehledné složky", "Vše má svoje místo a najdeš to rychle."],
                                [
                                    "Soubor i složka jedním klikem",
                                    "Vytvářej nové položky rovnou ze sidebaru.",
                                ],
                                [
                                    "Příjemné UI",
                                    "Jemné animace, konzistentní karty a rozumné mezery.",
                                ],
                                ["Google login", "Bez registrace a bez hesel."],
                                ["Rychlé akce", "Nový soubor / složka kdykoliv po ruce."],
                                ["Škálovatelný layout", "Vypadá dobře na PC i menších displejích."],
                            ].map(([t, d], i) => (
                                <Reveal key={t} delay={i * 60}>
                                    <BigCard title={t} desc={d} />
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* SECTION: How it works */}
            <section id="how" className="relative z-10 mx-auto max-w-7xl px-8 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <Reveal>
                        <h2 className="text-2xl md:text-3xl font-extrabold">Jak to funguje</h2>
                        <p className="text-gray-600 mt-2 max-w-xl">
                            Jednoduše: přihlásíš se, vytvoříš složku nebo soubor a ukládáš
                            věci, ke kterým se chceš vrátit.
                        </p>

                        <div className="mt-6 space-y-3">
                            <Reveal delay={60}>
                                <Step
                                    n="1"
                                    title="Přihlas se přes Google"
                                    desc="Bez hesla, bezpečně."
                                />
                            </Reveal>
                            <Reveal delay={120}>
                                <Step
                                    n="2"
                                    title="Vytvoř složku nebo soubor"
                                    desc="Akce jsou v sidebaru."
                                />
                            </Reveal>
                            <Reveal delay={180}>
                                <Step
                                    n="3"
                                    title="Ukládej a vrať se později"
                                    desc="Všechno hezky na jednom místě."
                                />
                            </Reveal>
                        </div>

                        <div className="mt-7 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => signIn("google", { callbackUrl: "/mainpage" })}
                                className={[loginWhiteBtn, "px-6 py-3.5 justify-center"].join(
                                    " "
                                )}
                            >
                                <GoogleIcon />
                                Přihlásit se a pokračovat
                            </button>
                            <a
                                href="#faq"
                                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white/70 hover:bg-white px-6 py-3.5 text-sm font-semibold text-gray-900 transition"
                            >
                                FAQ
                            </a>
                        </div>
                    </Reveal>

                    <Reveal delay={120}>
                        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6">
                            <h3 className="font-extrabold">Příklady použití</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Co si lidi typicky ukládají na později:
                            </p>

                            {/* ✅ equal-height tiles */}
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-fr items-stretch">
                                {[
                                    ["Formuláře", "vyplním později"],
                                    ["Dokumenty", "projdu později"],
                                    ["Screenshots", "zpracuju později"],
                                    ["Inspirace", "vrátím se k tomu"],
                                ].map(([t, d], i) => (
                                    <Reveal key={t} delay={i * 60}>
                                        <MiniUseCase title={t} desc={d} />
                                    </Reveal>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 rounded-3xl border border-gray-200 bg-white/70 backdrop-blur shadow-sm p-6">
                            <p className="text-sm font-semibold">Pro tip</p>
                            <p className="text-sm text-gray-600 mt-1">
                                Udržuj si 3–7 složek a pojmenovávej je podle kontextu:
                                <span className="font-semibold text-gray-800">
                  {" "}
                                    Práce, Osobní, Škola, Později
                </span>
                                .
                            </p>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* SECTION: FAQ */}
            <section id="faq" className="relative z-10 mx-auto max-w-7xl px-8 pb-20">
                <Reveal>
                    <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 md:p-10">
                        <div className="flex items-end justify-between gap-6">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-extrabold">FAQ</h2>
                                <p className="text-gray-600 mt-2">
                                    Nejčastější otázky kolem přihlášení a používání.
                                </p>
                            </div>
                        </div>

                        {/* ✅ equal-height FAQ cards */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr items-stretch">
                            {[
                                ["Musím si vytvářet heslo?", "Ne. Přihlášení je přes Google OAuth."],
                                [
                                    "Můžu změnit email?",
                                    "Email je z Google účtu a je read-only v aplikaci.",
                                ],
                                [
                                    "Kde změním jméno nebo fotku?",
                                    "V nastavení Google účtu – u nás se to pak načte.",
                                ],
                                [
                                    "Co když se odhlásím?",
                                    "Odhlásíš se z aplikace. Google účet v prohlížeči se řídí tvým nastavením.",
                                ],
                            ].map(([q, a], i) => (
                                <Reveal key={q} delay={i * 70}>
                                    <FaqItem q={q} a={a} />
                                </Reveal>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-5">
                            <div>
                                <p className="font-extrabold">Připraven začít?</p>
                                <p className="text-sm text-gray-600">
                                    Přihlášení zabere pár sekund.
                                </p>
                            </div>
                            <button
                                onClick={() => signIn("google", { callbackUrl: "/mainpage" })}
                                className={[loginWhiteBtn, "px-6 py-3 justify-center"].join(" ")}
                            >
                                <GoogleIcon />
                                Přihlásit se
                            </button>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-gray-200 bg-white/70 backdrop-blur">
                <div className="mx-auto max-w-7xl px-8 py-10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">Fill Out Later</span> •
                        ukládej věci na později
                    </div>
                    <div className="text-sm text-gray-500">
                        © {new Date().getFullYear()} • Přihlášení přes Google
                    </div>
                </div>
            </footer>

            {/* Simple CSS animations */}
            <style jsx global>{`
                /* ✅ extra overflow guard */
                html,
                body {
                    overflow-x: hidden;
                }

                /* ✅ scroll reveal (legacy, not used because we use framer-motion) */
                .reveal {
                    opacity: 0;
                    transform: translateY(18px);
                    transition: opacity 650ms ease, transform 650ms ease;
                    will-change: opacity, transform;
                }
                .reveal--in {
                    opacity: 1;
                    transform: translateY(0);
                }

                .blob {
                    position: absolute;
                    width: 520px;
                    height: 520px;
                    border-radius: 9999px;
                    filter: blur(40px);
                    opacity: 0.35;
                    animation: floaty 10s ease-in-out infinite;
                    background: radial-gradient(circle at 30% 30%, #38bdf8, transparent 60%),
                    radial-gradient(circle at 70% 70%, #60a5fa, transparent 55%);
                }
                .blob-1 {
                    top: -180px;
                    left: -140px;
                }
                .blob-2 {
                    top: 120px;
                    right: -180px;
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

function GoogleIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
            <path
                fill="#FFC107"
                d="M43.6 20.4H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.2l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.6z"
            />
            <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.6 16.1 19 12 24 12c3.1 0 5.9 1.2 8 3.2l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
            />
            <path
                fill="#4CAF50"
                d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.4 35.1 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z"
            />
            <path
                fill="#1976D2"
                d="M43.6 20.4H42V20H24v8h11.3c-1 2.6-2.8 4.8-5 6.3l6.3 5.2C39.7 36.6 44 31.4 44 24c0-1.3-.1-2.7-.4-3.6z"
            />
        </svg>
    );
}

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
            {children}
        </div>
    );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="h-full rounded-3xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition will-change-transform flex flex-col">
            <p className="font-extrabold">{title}</p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{desc}</p>
        </div>
    );
}

function BigCard({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="h-full rounded-3xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition will-change-transform flex flex-col">
            <p className="font-extrabold">{title}</p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{desc}</p>
        </div>
    );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
    return (
        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur p-4 hover:bg-white transition">
            <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-2xl bg-sky-100 text-sky-700 font-extrabold flex items-center justify-center shrink-0">
                    {n}
                </div>
                <div>
                    <p className="font-extrabold">{title}</p>
                    <p className="text-sm text-gray-600 mt-1">{desc}</p>
                </div>
            </div>
        </div>
    );
}

function MiniUseCase({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="h-full rounded-3xl border border-gray-200 bg-white p-4 hover:shadow-sm hover:-translate-y-0.5 transition flex flex-col">
            <p className="font-extrabold">{title}</p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{desc}</p>
        </div>
    );
}

function FaqItem({ q, a }: { q: string; a: string }) {
    return (
        <div className="h-full rounded-3xl border border-gray-200 bg-gray-50 p-5 hover:bg-white transition flex flex-col">
            <p className="font-extrabold">{q}</p>
            <p className="text-sm text-gray-600 mt-2 line-clamp-3">{a}</p>
        </div>
    );
}

function PreviewPanel() {
    return (
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
                <p className="font-extrabold">Náhled</p>
                <span className="text-xs text-gray-500">Desktop UI</span>
            </div>

            {/* ✅ equal-height tiles */}
            <div className="mt-4 grid grid-cols-2 gap-4 auto-rows-fr items-stretch">
                <PreviewTile />
                <PreviewTile />
                <PreviewTile />
                <PreviewTile />
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-extrabold">Tip</p>
                <p className="text-sm text-gray-600 mt-1">
                    Udržuj layout čistý: méně složek, lepší pojmenování.
                </p>
            </div>
        </div>
    );
}

function PreviewTile() {
    return (
        <div className="h-full min-h-[140px] rounded-3xl border border-gray-200 bg-gray-50 p-4 hover:bg-white hover:shadow-sm transition flex flex-col">
            <div className="h-10 w-10 rounded-2xl bg-sky-100 mb-3" />
            <div className="h-4 w-2/3 bg-gray-200/60 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-200/60 rounded" />
        </div>
    );
}