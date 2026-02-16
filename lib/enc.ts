import crypto from "crypto";
import "server-only"

const algorithm = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");
    return {
        encrypted,
        iv: iv.toString("hex"),
        tag,
    };
}

export function decrypt(encrypted: string, iv: string, tag: string) {
    const decipher = crypto.createDecipheriv(
        algorithm,
        Buffer.from(ENCRYPTION_KEY),
        Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(tag, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
