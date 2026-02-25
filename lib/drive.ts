// lib/drive.ts
import { google } from "googleapis";

export async function createDriveFolder(opts: {
    accessToken: string;
    name: string;
    parentId?: string; // default "root"
}) {
    const oauth2 = new google.auth.OAuth2();
    oauth2.setCredentials({ access_token: opts.accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2 });

    const res = await drive.files.create({
        requestBody: {
            name: opts.name,
            mimeType: "application/vnd.google-apps.folder",
            parents: [opts.parentId ?? "root"],
        },
        fields: "id, name",
        supportsAllDrives: true,
    });

    if (!res.data.id) throw new Error("Drive folder creation returned no id");

    return { id: res.data.id, name: res.data.name ?? opts.name };
}