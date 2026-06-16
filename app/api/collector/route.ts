import "server-only";
import { NextResponse } from "next/server";
import { oneDrive } from "@/lib/onedrive";
import { uniqueFilename } from "@/lib/filename";

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
        // Read + refresh the stored token (rotates the refresh token automatically)
        const accessToken = await oneDrive.getAccessToken();

        const buffer = await file.arrayBuffer();

        // Delegated token => upload into the app's own folder (approot).
        // Lands in OneDrive/Aplikace/onedrive-Uploader/<filename>
        // Unikátní název podle času + náhodného tokenu, ať se nic nepřepíše.
        const safeName = encodeURIComponent(uniqueFilename(filename));
        const uploadRes = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${safeName}:/content`,
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
            throw new Error(err?.error?.message || "Upload selhal");
        }

        const data = await uploadRes.json();

        return NextResponse.json(
            { success: true, fileId: data.id, name: data.name, webUrl: data.webUrl },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("[Collector] Error:", err?.message);
        return NextResponse.json({ error: err?.message ?? "Něco se pokazilo" }, { status: 500 });
    }
}
