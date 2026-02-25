import "server-only";
import {firestore} from "@/lib/firebase-admin";
import {google} from "googleapis";
import { getServerSession } from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import {NextResponse} from "next/server";
import { Readable } from "stream";
export async function Post(req: Request) {
    const session = await getServerSession(authOptions);


    const form = await req.formData();
    const file = form.get("file");
    const path = form.get("path");
    const filename = form.get("filename");
    const userId = form.get("userId");

    const userDoc = await firestore
        .collection("users")
        .doc(userId)
        .get();
    if (!(file instanceof File)) {
        return Response.json({ error: "No file uploaded" }, { status: 400 });
    }
    const userData = userDoc.data();
    const accessToken = session?.accessToken;
    const rootfolderId = userData?.drive?.rootFolderId;
    const oauth2 = new google.auth.OAuth2();
    oauth2.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: "v3", auth: oauth2 });
    const bytes = Buffer.from(await file?.arrayBuffer());
    const driveRes = await drive.files.create({
        requestBody: {
            name: file.name,
            parents: rootfolderId ? [rootfolderId] : undefined,
        },
        media: {
            mimeType: file.type,
            body:   bytes,
        },
        fields: "id, webViewLink",
        supportsAllDrives: true,
    });

    const driveFileId = driveRes.data.id;
    const driveWebViewLink = driveRes.data.webViewLink;
    if (!driveFileId) {
        return NextResponse.json({ error: "Drive upload failed (no id)" }, { status: 500 });
    }


}