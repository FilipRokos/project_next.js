"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { FaUser, FaCog, FaPlus, FaBars } from "react-icons/fa";
import { useState } from "react";
import {redirect} from "next/navigation";

export default function MainPage() {
    const { data: session, status } = useSession();
    const [sidebarOpen, setSidebarOpen] = useState(true);


    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-400 animate-pulse text-lg">Načítám session…</p>
            </div>
        );
    }

    if (!session) {
        redirect("/");
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
            {/* Top Navbar */}
            <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-md hover:bg-gray-100 transition"
                    >
                        <FaBars size={20} />
                    </button>
                    <h1 className="text-2xl font-bold tracking-wide">Fill Out Later</h1>
                </div>
                <div className="flex items-center gap-4">

                    <button
                        onClick={() => signOut()}
                        className="bg-sky-400 hover:bg-sky-500 px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                {sidebarOpen && (
                    <aside className="flex flex-col items-center w-20 bg-white border-r border-gray-200 py-6 gap-6 shadow-md">
                        <button className="p-3 rounded-xl hover:bg-gray-100 transition text-gray-700">
                            <FaUser size={24} />
                        </button>

                        <button className="p-3 rounded-xl hover:bg-gray-100 transition text-gray-700">
                            <FaCog size={24} />
                        </button>

                        <button className="p-3 mt-auto mb-2 rounded-xl bg-sky-400 text-white hover:bg-sky-500 transition">
                            <FaPlus size={24} />
                        </button>
                    </aside>
                )}

                {/* Main Box */}
                <main className="flex-1 p-10 overflow-auto flex flex-col">
                    {/* Hlavní obsah */}
                    <div className="w-full h-full flex flex-col items-center justify-start gap-6">
                        <p className="text-gray-400">
                            Zde se budou zobrazovat složky a obrázky uživatele
                        </p>
                        {/* Sem budeš vykreslovat složky / obrázky */}
                    </div>
                </main>

            </div>
        </div>
    );
}
