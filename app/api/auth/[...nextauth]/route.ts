// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { firestore } from "@/lib/firebase-admin";
import { encrypt } from "@/lib/enc";
import { createDriveFolder } from "@/lib/drive";
import admin from "firebase-admin";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope:
                        "openid email profile https://www.googleapis.com/auth/drive.file",
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],

    session: { strategy: "jwt" },

    callbacks: {
        async jwt({ token, account, profile }) {
            // account/profile are typically present only on initial sign-in
            if (account && profile?.sub) {
                const userId = profile.sub;

                // Access token (short-lived)
                if (account.access_token) token.accessToken = account.access_token;

                // Refresh token (long-lived) - only shows up first consent or when re-consented
                if (account.refresh_token) {
                    const encrypted = encrypt(account.refresh_token);
                    await firestore
                        .collection("secrets")
                        .doc(userId)
                        .set(
                            { refreshToken: encrypted, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
                            { merge: true }
                        );
                }

                // Read existing user doc to avoid recreating folder + overwriting createdAt
                const userRef = firestore.collection("users").doc(userId);
                const userSnap = await userRef.get();
                const existing = userSnap.exists ? userSnap.data() : null;

                // Only create Drive folder if we don't have one saved yet
                let driveRootFolderId = existing?.drive?.rootFolderId as string | undefined;
                let driveRootPath = existing?.drive?.rootPath as string | undefined;

                if (!driveRootFolderId) {
                    if (!account.access_token) {
                        // can't create folder without an access token right now
                        // keep user as-is; they can re-login or you can handle later via refresh token
                        console.warn("No access_token; cannot create Drive folder on sign-in");
                    } else {
                        const folderName = process.env.DRIVE_ROOT_FOLDER_NAME ?? "test";
                        const folder = await createDriveFolder({
                            accessToken: account.access_token,
                            name: folderName,
                            parentId: "root",
                        });

                        driveRootFolderId = folder.id;
                        // Drive doesn't have real paths; this is your "virtual path"
                        driveRootPath = `/${folder.name}`;
                    }
                }

                // Upsert user doc (don't overwrite createdAt if it already exists)
                await userRef.set(
                    {
                        email: profile.email ?? null,
                        name: profile.name ?? null,
                        drive: {
                            rootFolderId: driveRootFolderId ?? existing?.drive?.rootFolderId ?? "root",
                            rootPath: driveRootPath ?? existing?.drive?.rootPath ?? "/",
                        },
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        ...(existing ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
                    },
                    { merge: true }
                );
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                // token.sub is the user id
                (session.user as any).id = token.sub;
            }
            (session as any).accessToken = (token as any).accessToken ?? "";
            return session;
        },
    },
};



const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };