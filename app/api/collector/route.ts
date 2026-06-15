import "server-only";
import { NextResponse } from "next/server";

async function getMicrosoftAccessToken(): Promise<string> {
    const res = await fetch(
        `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.MICROSOFT_CLIENT_ID!,
                client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
                grant_type: "client_credentials",
                scope: "https://graph.microsoft.com/.default",
            }),
        }
    );

    const json = await res.json();

    if (!json.access_token) {
        console.error("[OneDrive] Token error:", JSON.stringify(json));
        throw new Error(json.error_description || json.error || "Failed to get Microsoft access token");
    }

    return json.access_token;
}

export async function POST(req: Request) {
    const form = await req.formData();
    const file = form.get("file");
    const filename = form.get("filename");

    if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "Soubor chybí" }, { status: 400 });
    }

    if (!filename || typeof filename !== "string") {
        return NextResponse.json({ error: "Název souboru chybí" }, { status: 400 });
    }

    try {
        const accessToken = await getMicrosoftAccessToken();

        const buffer = await file.arrayBuffer();

        const uploadRes = await fetch(
            `https://graph.microsoft.com/v1.0/users/${process.env.MICROSOFT_USER_ID}/drive/root:/uploads/${filename}:/content`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": file.type || "application/octet-stream",
                },
                body: buffer,
            }
        );

        if (!uploadRes.ok) {
            const err = await uploadRes.json();
            console.error("[Collector] Graph error:", JSON.stringify(err));
            throw new Error(JSON.stringify(err?.error) || "Upload selhal");
        }

        const data = await uploadRes.json();

        return NextResponse.json({ success: true, fileId: data.id, name: data.name }, { status: 200 });
    } catch (err: any) {
        console.error("[Collector] Error:", err.message);
        return NextResponse.json({ error: err.message ?? "Něco se pokazilo", debug: err.message }, { status: 500 });
    }
}
