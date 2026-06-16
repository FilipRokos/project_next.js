import "server-only";
import { NextResponse } from "next/server";
import { oneDrive } from "@/lib/onedrive";

/**
 * Návratová routa z přihlášení Microsoftu.
 * Microsoft sem pošle prohlížeč s ?code=... (nebo ?error=... když se nepovede).
 * Kód vyměníme za refresh token a uložíme ho do Firestore.
 *
 * redirect_uri MUSÍ být přesně stejné jako v /connect a registrované v Azure:
 *   http://localhost:3000/api/oneDrive/callback
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Microsoft vrátil chybu (např. uživatel odmítl souhlas)
    if (error) {
        return htmlPage(
            "❌ Připojení selhalo",
            `${error}${errorDescription ? `: ${errorDescription}` : ""}`,
            false
        );
    }

    if (!code) {
        return htmlPage("❌ Chybí autorizační kód", "V URL nebyl žádný ?code=...", false);
    }

    try {
        const redirectUri = `${process.env.NEXTAUTH_URL}/api/oneDrive/callback`;
        await oneDrive.exchangeCode(code, redirectUri);

        return htmlPage(
            "✅ OneDrive připojený",
            "Refresh token byl uložen. Tuhle stránku můžeš zavřít — uploady teď budou chodit do složky aplikace.",
            true
        );
    } catch (e: any) {
        console.error("[OneDrive callback] error:", e?.message);
        return htmlPage("❌ Uložení tokenu selhalo", e?.message ?? "Neznámá chyba", false);
    }
}

function htmlPage(title: string, message: string, ok: boolean) {
    const color = ok ? "#059669" : "#e11d48";
    return new NextResponse(
        `<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="font-family:ui-sans-serif,system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;max-width:420px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.05)">
    <h1 style="font-size:18px;margin:0 0 8px;color:${color}">${title}</h1>
    <p style="font-size:14px;color:#64748b;line-height:1.5;margin:0 0 20px">${message}</p>
    <a href="/mainpage" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:8px 16px;border-radius:8px">Zpět do aplikace</a>
  </div>
</body></html>`,
        { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
}
