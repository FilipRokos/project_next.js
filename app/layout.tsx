// app/layout.tsx
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="cs">
        <body>
        <SessionProviderWrapper>
            {children}
        </SessionProviderWrapper>
        </body>
        </html>
    );
}
/*"use server";
import "server-only";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";


export async function safe() {
    const session = await getServerSession(authOptions);
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${session?.accessToken}`;

    const Googleres = await fetch(url, {
        method: "GET",
    });

    if (!Googleres.ok) {
        return {
            status: "not ok",
        };
    }

    const data = await Googleres.json();
    return {
        status: "ok",
        data,
    };
}*/