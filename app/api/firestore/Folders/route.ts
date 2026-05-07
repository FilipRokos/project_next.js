import "server-only";
import {firestore} from "@/lib/firebase-admin";
import {google} from "googleapis";
import { getServerSession } from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import {NextResponse} from "next/server";
import { Readable } from "node:stream";
import {query} from "@firebase/database";
import {collection, where} from "@firebase/firestore";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);


    const form = await req.formData();
    const name = form.get("name");
    const parentId = form.get("parentId") as string;
    const path = (form.get("parentPath") as string | null) ?? "/";
    const userId = session?.user.id;
    await firestore.collection("users").doc(userId).collection("files").doc().set({
        name: name,
        parentId: parentId,
        path: path+name,
        type: "folder",
    })
    if(!form.get("name"))
    {
        return NextResponse.json({ error: "conection interupted" }, { status: 500 });
    }
    return NextResponse.json(
        {
            success: true,

        },
        { status: 200 }
    );
}
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    const userId = session?.user.id;
    const snapshot = await firestore.collection("users").doc(userId).collection("files").where("type", "==", "folder").get();
    const folders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
    console.log(folders);
    return Response.json({ folders });
}