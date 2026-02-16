"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 animate-pulse">Načítám session…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8 text-center">
                {!session ? (
                    <>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Vítej
                        </h1>
                        <p className="text-gray-500 mb-6">

                            Přihlas se pomocí Google účtu
                        </p>


                        <button
                            onClick={() => signIn("google")}
                            className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 48 48">
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
                            Sign in with Google
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl font-semibold text-gray-900 mb-1">
                            Přihlášen
                        </h1>
                        <p className="text-gray-500 mb-6 break-all">
                            {session.user?.email}
                        </p>

                        <button
                            onClick={() => signOut()}
                            className="w-full rounded-xl bg-gray-900 text-white py-3 font-medium hover:bg-gray-800 transition"
                        >
                            Odhlásit se
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
