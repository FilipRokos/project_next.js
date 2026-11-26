export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 25_000_000;
export type Point = [number, number];
export type Segmentation = { detected: false; confidence: number; polygon: []; box: null } |
    { detected: true; confidence: number; polygon: Point[]; box: [number, number, number, number] };

export function parseSegmentation(value: unknown): Segmentation {
    const fail = () => { throw new Error("Neplatná odpověď segmentace."); };
    if (!value || typeof value !== "object") return fail();
    const v = value as Record<string, unknown>;
    const unit = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
    if (!unit(v.confidence) || !Array.isArray(v.polygon)) return fail();
    if (v.detected === false && v.confidence === 0 && v.polygon.length === 0 && v.box === null)
        return { detected: false, confidence: 0, polygon: [], box: null };
    if (v.detected !== true || v.polygon.length < 3 || v.polygon.length > 100_000 ||
        !v.polygon.every(p => Array.isArray(p) && p.length === 2 && p.every(unit)) ||
        !Array.isArray(v.box) || v.box.length !== 4 || !v.box.every(unit) ||
        v.box[0] >= v.box[2] || v.box[1] >= v.box[3]) return fail();
    const polygon = v.polygon as Point[];
    const area = polygon.reduce((sum, p, i) => {
        const q = polygon[(i + 1) % polygon.length];
        return sum + p[0] * q[1] - q[0] * p[1];
    }, 0);
    if (Math.abs(area) < 1e-12) return fail();
    return { detected: true, confidence: v.confidence, polygon, box: v.box as [number, number, number, number] };
}

export function polygonGeometry(points: Point[], width: number, height: number) {
    const pixels = points.map(([x, y]): Point => [x * width, y * height]);
    const xs = pixels.map(p => p[0]), ys = pixels.map(p => p[1]);
    const left = Math.max(0, Math.floor(xs.reduce((a, b) => Math.min(a, b), Infinity)));
    const top = Math.max(0, Math.floor(ys.reduce((a, b) => Math.min(a, b), Infinity)));
    const right = Math.min(width, Math.ceil(xs.reduce((a, b) => Math.max(a, b), -Infinity)));
    const bottom = Math.min(height, Math.ceil(ys.reduce((a, b) => Math.max(a, b), -Infinity)));
    return { pixels, left, top, width: right - left, height: bottom - top };
}

export function receiptFilename(name: string) {
    return (name.trim().replace(/\.(png|jpe?g|webp|gif)$/i, "") || "uctenka") + ".webp";
}

function receiptPath(pixels: Point[]) {
    const path = new Path2D();
    pixels.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y));
    path.closePath();
    return path;
}

export function drawReceiptPreview(image: ImageBitmap, polygon: Point[], preview: HTMLCanvasElement) {
    const g = polygonGeometry(polygon, image.width, image.height);
    const path = receiptPath(g.pixels);
    // Preview and export never share a drawing surface.
    preview.width = image.width; preview.height = image.height;
    const display = preview.getContext("2d")!;
    display.drawImage(image, 0, 0);
    display.fillStyle = "rgba(37, 99, 235, 0.25)";
    display.strokeStyle = "#2563eb";
    display.lineWidth = Math.max(2, image.width / 400);
    display.fill(path); display.stroke(path);
}

export async function extractReceipt(image: ImageBitmap, polygon: Point[]) {
    const g = polygonGeometry(polygon, image.width, image.height);
    if (g.width <= 0 || g.height <= 0) throw new Error("Prázdný výřez účtenky.");
    const path = receiptPath(g.pixels);
    const canvas = document.createElement("canvas");
    canvas.width = g.width; canvas.height = g.height;
    try {
        const ctx = canvas.getContext("2d")!;
        ctx.translate(-g.left, -g.top);
        ctx.clip(path);
        ctx.drawImage(image, 0, 0);
        return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob?.type === "image/webp" ? resolve(blob) : reject(new Error("Výřez nelze uložit.")), "image/webp", 0.9));
    } finally { canvas.width = 0; canvas.height = 0; }
}
