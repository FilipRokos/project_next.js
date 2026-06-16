import "server-only";
import crypto from "crypto";

/**
 * Vytvoří unikátní název souboru z času uploadu + krátkého náhodného tokenu.
 * Z původního názvu se bere pouze přípona.
 *
 *   "nakup lidl.jpg"  ->  "20260616-143052-3f9a.jpg"
 *
 * Časové razítko dělá názvy chronologicky seřaditelné; náhodný token pokryje
 * i případ, kdy by dvě zařízení nahrála ve stejnou sekundu.
 */
export function uniqueFilename(original: string): string {
    const dotIndex = original.lastIndexOf(".");
    const ext = dotIndex > 0 ? original.slice(dotIndex + 1).toLowerCase() : "";

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp =
        `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
        `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const rand = crypto.randomBytes(2).toString("hex"); // 4 hex znaků

    const unique = `${stamp}-${rand}`;
    return ext ? `${unique}.${ext}` : unique;
}
