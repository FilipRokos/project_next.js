import "server-only";
import {firestore} from "@/lib/firebase-admin";
export async function Post(req: Request) {
    const form = await req.formData();
    const file = form.get("file");
    const path = form.get("path");
    const filename = form.get("filename");

}