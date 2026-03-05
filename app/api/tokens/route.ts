import "server-only";
import {firestore} from "@/lib/firebase-admin";
import {google} from "googleapis";
import { getServerSession } from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import {NextResponse} from "next/server";
import { decrypt } from "@/lib/enc";

async function getToken(userId: string) {
    const userSecrets = await firestore.collection("secrets").doc(userId).get();
    const key = userSecrets.data()
     const refreshToken = decrypt(key?.refreshToken?.encrypted,key?.refreshToken?.iv,key?.refreshToken?.tag)
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });
    const json = await res.json();
    return json.access_token;
}