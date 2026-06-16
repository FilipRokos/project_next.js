import "server-only";
import { firestore } from "@/lib/firebase-admin";
import { encrypt, decrypt } from "@/lib/enc";
import admin from "firebase-admin";

/**
 * OneDrive (Microsoft Graph) token manager.
 *
 * Uses the delegated authorization-code flow with a rotating refresh token,
 * scoped to the app folder (Files.ReadWrite.AppFolder). The refresh token is
 * stored encrypted in Firestore under `secrets/onedrive-system` — a single,
 * fixed document because it always represents the same (owner's) account, not
 * a per-user token.
 *
 * On every access-token request the rotated refresh token is persisted back,
 * so as long as it's used within the 90-day window it effectively never expires.
 */

const SECRET_DOC = "onedrive-system";
const SCOPE = "Files.ReadWrite.AppFolder offline_access";

const tokenUrl = () =>
    `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;

const authUrl = () =>
    `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`;

type EncryptedField = { encrypted: string; iv: string; tag: string };

class OneDriveToken {
    /** Encrypt + store the refresh token (one fixed doc for the owner account). */
    async saveRefreshToken(refreshToken: string): Promise<void> {
        const enc = encrypt(refreshToken);
        await firestore
            .collection("secrets")
            .doc(SECRET_DOC)
            .set(
                {
                    msRefreshToken: enc,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
    }

    /** Read + decrypt the stored refresh token. Throws if not set up yet. */
    private async readRefreshToken(): Promise<string> {
        const snap = await firestore.collection("secrets").doc(SECRET_DOC).get();
        const field = snap.data()?.msRefreshToken as EncryptedField | undefined;

        if (!field?.encrypted) {
            throw new Error(
                "OneDrive není připojený — chybí refresh token. Spusť nejdřív jednorázové přihlášení."
            );
        }

        return decrypt(field.encrypted, field.iv, field.tag);
    }

    /**
     * Main entry point: returns a valid access token.
     * Reads the stored refresh token, exchanges it, and persists the rotated
     * refresh token that Microsoft returns.
     */
    async getAccessToken(): Promise<string> {
        const refreshToken = await this.readRefreshToken();

        const res = await fetch(tokenUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.MICROSOFT_CLIENT_ID!,
                client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                scope: SCOPE,
            }),
        });

        const json = await res.json();

        if (!json.access_token) {
            console.error("[OneDrive] refresh failed:", JSON.stringify(json));
            throw new Error(
                json.error_description || json.error || "Nepodařilo se obnovit OneDrive token"
            );
        }

        // Rotate: persist the new refresh token so the 90-day clock keeps resetting.
        if (json.refresh_token) {
            await this.saveRefreshToken(json.refresh_token);
        }

        return json.access_token as string;
    }

    /** Build the consent URL for the one-time authorization. */
    buildAuthUrl(redirectUri: string, state?: string): string {
        const params = new URLSearchParams({
            client_id: process.env.MICROSOFT_CLIENT_ID!,
            response_type: "code",
            redirect_uri: redirectUri,
            response_mode: "query",
            scope: SCOPE,
            prompt: "consent",
            ...(state ? { state } : {}),
        });
        return `${authUrl()}?${params.toString()}`;
    }

    /**
     * One-time: exchange the authorization `code` for tokens and store the
     * resulting refresh token. `redirectUri` must match the one used to obtain
     * the code (and be registered in Azure).
     */
    async exchangeCode(code: string, redirectUri: string): Promise<void> {
        const res = await fetch(tokenUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.MICROSOFT_CLIENT_ID!,
                client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                scope: SCOPE,
            }),
        });

        const json = await res.json();

        if (!json.refresh_token) {
            console.error("[OneDrive] code exchange failed:", JSON.stringify(json));
            throw new Error(
                json.error_description || json.error || "Výměna kódu za token selhala"
            );
        }

        await this.saveRefreshToken(json.refresh_token);
    }

    /** Has the one-time authorization been completed? */
    async isConnected(): Promise<boolean> {
        const snap = await firestore.collection("secrets").doc(SECRET_DOC).get();
        return Boolean((snap.data()?.msRefreshToken as EncryptedField | undefined)?.encrypted);
    }
}

export const oneDrive = new OneDriveToken();
export default OneDriveToken;
