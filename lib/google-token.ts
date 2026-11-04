import "server-only";
import { firestore } from "@/lib/firebase-admin";
import { decrypt } from "@/lib/enc";

export class GoogleTokenError extends Error {
    constructor(public readonly code: "REAUTH_REQUIRED" | "TOKEN_RETRY") {
        super(code === "REAUTH_REQUIRED"
            ? "Please sign in again to reconnect Google Drive."
            : "Google Drive is temporarily unavailable. Please retry.");
    }
}

// Share the entire read/refresh/save operation within this server process.
const pending = new Map<string, Promise<string>>();
export function getGoogleAccessToken(userId: string): Promise<string> {
    const existing = pending.get(userId);
    if (existing) return existing;
    const operation = loadToken(userId).catch((error: unknown) => {
        if (error instanceof GoogleTokenError) throw error;
        throw new GoogleTokenError("TOKEN_RETRY");
    }).finally(() => pending.delete(userId));
    pending.set(userId, operation);
    return operation;
}

async function loadToken(userId: string): Promise<string> {
    const ref = firestore.collection("secrets").doc(userId);
    const secrets = (await ref.get()).data();
    if (secrets?.accessToken && Number.isFinite(secrets.accessTokenExpiresAt)
        && secrets.accessTokenExpiresAt > Date.now() + 60_000) {
        return secrets.accessToken;
    }
    if (!secrets?.refreshToken) throw new GoogleTokenError("REAUTH_REQUIRED");
    const { encrypted, iv, tag } = secrets.refreshToken;
    const refreshToken = decrypt(encrypted, iv, tag);
    const startedAt = Date.now();
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new GoogleTokenError(response.status === 400 && data.error === "invalid_grant"
            ? "REAUTH_REQUIRED" : "TOKEN_RETRY");
    }
    if (typeof data.access_token !== "string" || !data.access_token
        || typeof data.expires_in !== "number" || !Number.isFinite(data.expires_in) || data.expires_in <= 60) {
        throw new GoogleTokenError("TOKEN_RETRY");
    }
    await ref.set({
        accessToken: data.access_token,
        accessTokenExpiresAt: startedAt + data.expires_in * 1000,
    }, { merge: true });
    return data.access_token;
}
