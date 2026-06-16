import "server-only";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { oneDrive } from "@/lib/onedrive";

/**
 * Jednorázové připojení OneDrive.
 * Přesměruje na přihlašovací obrazovku Microsoftu. Po souhlasu tě Microsoft
 * pošle zpět na /api/onedrive/callback s parametrem ?code=...
 *
 * Chráněno přihlášením do aplikace, aby connect nemohl spustit kdokoliv cizí.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json(
            { error: "Nejdřív se přihlas do aplikace." },
            { status: 401 }
        );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/oneDrive/callback`;
    const url = oneDrive.buildAuthUrl(redirectUri);

    return NextResponse.redirect(url);
}
