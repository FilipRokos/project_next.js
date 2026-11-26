import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import sharp from "sharp";
import { MAX_IMAGE_BYTES, MAX_IMAGE_PIXELS, parseSegmentation } from "@/lib/receipt-segmentation";

export const runtime = "nodejs";
const error = (message: string, status: number) => Response.json({ error: message }, { status });

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Přihlas se prosím znovu.", 401);
    const url = process.env.RECEIPT_API_URL, key = process.env.RECEIPT_API_KEY;
    if (!url || !key) return error("Segmentace není nakonfigurována.", 503);
    // Bound the multipart body even when Content-Length is absent.
    const limit = MAX_IMAGE_BYTES + 64 * 1024;
    if (Number(req.headers.get("content-length")) > limit) return error("Soubor je příliš velký (max. 15 MiB).", 413);
    let file: File;
    try {
        const reader = req.body?.getReader();
        if (!reader) return error("Soubor chybí.", 400);
        const chunks: Uint8Array[] = []; let size = 0;
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > limit) { await reader.cancel(); return error("Soubor je příliš velký (max. 15 MiB).", 413); }
            chunks.push(value);
        }
        const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": req.headers.get("content-type") || "" } }).formData();
        const input = form.get("file");
        if (!(input instanceof File) || !["image/jpeg", "image/png"].includes(input.type) || !input.size)
            return error("Vyber platný obrázek JPEG nebo PNG.", 400);
        if (input.size > MAX_IMAGE_BYTES) return error("Soubor je příliš velký (max. 15 MiB).", 413);
        file = input;
        const bytes = Buffer.from(await file.arrayBuffer());
        const decoder = sharp(bytes, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "warning" });
        const metadata = await decoder.metadata();
        if ((metadata.format !== "jpeg" && metadata.format !== "png") || `image/${metadata.format}` !== file.type || (metadata.pages ?? 1) > 1)
            return error("Vyber statický obrázek JPEG nebo PNG.", 400);
        await decoder.stats(); // Force decoding to reject corrupt image data.
    } catch { return error("Neplatný obrázek nebo překročen limit 25 milionů pixelů.", 400); }
    const timeout = AbortSignal.timeout(30_000);
    try {
        const body = new FormData(); body.append("file", file);
        const response = await fetch(url, { method: "POST", headers: { "x-api-key": key }, body,
            signal: AbortSignal.any([timeout, req.signal]), redirect: "error" });
        if (!response.ok) return error("Služba segmentace odmítla požadavek. Zkus to znovu.", 502);
        return Response.json(parseSegmentation(await response.json()));
    } catch {
        return error(timeout.aborted ? "Segmentace trvá příliš dlouho. Zkus to znovu." : "Segmentace není dostupná nebo vrátila neplatná data.", timeout.aborted ? 504 : 502);
    }
}
