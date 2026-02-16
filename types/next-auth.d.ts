import NextAuth from "next-auth";
import {ISODateString} from "next-auth/src/core/types";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
    }
}
export interface DefaultSession {
    user?: {
        name?: string | null
        email?: string | null
        image?: string | null
        id?: string | null
    }
    expires: ISODateString
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
    }
}
