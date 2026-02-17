// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { firestore } from "@/lib/firebase-admin";


import { encrypt } from "@/lib/enc"; // your AES encrypt function

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

    session: {
        strategy: "jwt", // use JWT session
    },


    callbacks: {
        async jwt({ token, account, profile }) {
            try {
                if (account && profile) {
                    if (profile.sub) {
                        token.id = profile.sub;
                    }
                    console.log("refresh_token:", account?.refresh_token);
                    if (account.access_token) {
                        token.accessToken = account.access_token;
                    }

                    if (profile.sub) {
                        if (account.refresh_token) {
                            try {
                                const encrypted = encrypt(account.refresh_token);

                                await firestore
                                    .collection("secrets")
                                    .doc(profile.sub)
                                    .set(
                                        {
                                            refreshToken: encrypted,
                                            updatedAt: new Date(),
                                        },
                                        { merge: true }
                                    );
                            } catch (err) {
                                console.error("Failed to store refresh token:", err);
                            }
                        }


                        try {
                            await firestore
                                .collection("users")
                                .doc(profile.sub)
                                .set(
                                    {
                                        email: profile.email,
                                        name: profile.name,
                                        drive: { rootFolderId: "root", rootPath: "/" },
                                        updatedAt: new Date(),
                                        createdAt: new Date(),
                                    },
                                    { merge: true }
                                );
                        } catch (err) {
                            console.error("❌ Failed to store user:", err);
                        }
                    }
                }
            } catch (err) {
                console.error("❌ JWT callback crashed:", err);
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub
                session.accessToken = token.accessToken ?? "";
            }
            return session;
        }
    },
};


const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };