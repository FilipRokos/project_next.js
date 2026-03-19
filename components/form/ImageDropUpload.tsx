"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useSession } from "next-auth/react";

type Props = {
    userId: string;
    path?: string;
    onUploaded?: (data: any) => void;
    onClose?: () => void;
};

type Point = {
    x: number;
    y: number;
};

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

declare global {
    interface Window {
        cv: any;
    }
}

function dataUrlToFile(dataUrl: string, filenameBase: string) {
    const [meta, b64] = dataUrl.split(",");
    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mime = mimeMatch?.[1] || "image/jpeg";

    const ext =
        mime === "image/png"
            ? "png"
            : mime === "image/webp"
                ? "webp"
                : mime === "image/gif"
                    ? "gif"
                    : "jpg";

    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);

    return new File([arr], `${filenameBase}.${ext}`, { type: mime });
}

function useOpenCv() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (window.cv?.Mat) {
            setReady(true);
            return;
        }

        const existing = document.querySelector('script[data-opencv="true"]') as HTMLScriptElement | null;

        if (existing) {
            const waitForCv = () => {
                if (window.cv?.Mat) setReady(true);
                else window.setTimeout(waitForCv, 100);
            };
            waitForCv();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://docs.opencv.org/4.x/opencv.js";
        script.async = true;
        script.setAttribute("data-opencv", "true");

        script.onload = () => {
            const waitForCv = () => {
                if (window.cv?.Mat) setReady(true);
                else window.setTimeout(waitForCv, 100);
            };
            waitForCv();
        };

        document.body.appendChild(script);
    }, []);

    return ready;
}

function distance(a: Point, b: Point) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function polygonArea(pts: Point[]) {
    if (pts.length !== 4) return 0;
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        area += pts[i].x * pts[j].y;
        area -= pts[j].x * pts[i].y;
    }
    return Math.abs(area / 2);
}

function centroid(pts: Point[]) {
    const sum = pts.reduce(
        (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
        { x: 0, y: 0 }
    );
    return { x: sum.x / pts.length, y: sum.y / pts.length };
}

function orderPoints(pts: Point[]) {
    const sum = pts.map((p) => p.x + p.y);
    const diff = pts.map((p) => p.x - p.y);

    const tl = pts[sum.indexOf(Math.min(...sum))];
    const br = pts[sum.indexOf(Math.max(...sum))];
    const tr = pts[diff.indexOf(Math.max(...diff))];
    const bl = pts[diff.indexOf(Math.min(...diff))];

    return [tl, tr, br, bl];
}

function isQuadStable(prev: Point[] | null, next: Point[] | null) {
    if (!prev || !next || prev.length !== 4 || next.length !== 4) return false;

    const prevCenter = centroid(prev);
    const nextCenter = centroid(next);

    const centerShift = distance(prevCenter, nextCenter);
    const prevArea = polygonArea(prev);
    const nextArea = polygonArea(next);
    const areaDiffRatio = prevArea > 0 ? Math.abs(nextArea - prevArea) / prevArea : 1;

    return centerShift < 20 && areaDiffRatio < 0.12;
}

export default function ImageDropUpload({
                                            userId,
                                            path = "/",
                                            onUploaded,
                                            onClose,
                                        }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [filename, setFilename] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);

    const { data: session, update } = useSession();

    const webcamRef = useRef<Webcam | null>(null);
    const overlayRef = useRef<HTMLCanvasElement | null>(null);
    const detectTimerRef = useRef<number | null>(null);

    const [mode, setMode] = useState<"idle" | "camera" | "captured">("idle");
    const [captured, setCaptured] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

    const [receiptQuad, setReceiptQuad] = useState<Point[] | null>(null);
    const [isStable, setIsStable] = useState(false);
    const [debugMessage, setDebugMessage] = useState("Hledám účtenku...");

    const previousQuadRef = useRef<Point[] | null>(null);
    const stableFramesRef = useRef(0);

    const cvReady = useOpenCv();

    const previewUrl = useMemo(() => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, [file]);

    useEffect(() => {
        if (!previewUrl) return;
        return () => URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const drawOverlay = useCallback(
        (quad: Point[] | null, sourceW: number, sourceH: number, stable: boolean) => {
            const canvas = overlayRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            canvas.width = rect.width;
            canvas.height = rect.height;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // dark guide
            ctx.fillStyle = "rgba(0,0,0,0.12)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (!quad) {
                // center guide rectangle
                const gw = canvas.width * 0.72;
                const gh = canvas.height * 0.7;
                const gx = (canvas.width - gw) / 2;
                const gy = (canvas.height - gh) / 2;

                ctx.clearRect(gx, gy, gw, gh);
                ctx.strokeStyle = "rgba(255,255,255,0.9)";
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 8]);
                ctx.strokeRect(gx, gy, gw, gh);
                ctx.setLineDash([]);
                return;
            }

            const scaleX = canvas.width / sourceW;
            const scaleY = canvas.height / sourceH;
            const scaled = quad.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY }));

            // cut hole inside detected polygon
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.moveTo(scaled[0].x, scaled[0].y);
            for (let i = 1; i < scaled.length; i++) ctx.lineTo(scaled[i].x, scaled[i].y);
            ctx.closePath();
            ctx.fill("evenodd");
            ctx.restore();

            // polygon
            ctx.beginPath();
            ctx.moveTo(scaled[0].x, scaled[0].y);
            for (let i = 1; i < scaled.length; i++) ctx.lineTo(scaled[i].x, scaled[i].y);
            ctx.closePath();

            ctx.lineWidth = 3;
            ctx.strokeStyle = stable ? "#22c55e" : "#facc15";
            ctx.fillStyle = stable ? "rgba(34,197,94,0.12)" : "rgba(250,204,21,0.10)";
            ctx.fill();
            ctx.stroke();

            // corners
            for (const p of scaled) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = stable ? "#22c55e" : "#facc15";
                ctx.fill();
            }
        },
        []
    );

    const setImage = useCallback(
        (f: File | null) => {
            if (!f) return;

            if (!ACCEPTED.includes(f.type)) {
                alert("Prosím nahraj obrázek (png, jpg, webp, gif).");
                return;
            }

            setFile(f);

            if (!filename.trim()) {
                const base = f.name.replace(/\.[^/.]+$/, "");
                setFilename(base);
            }

            setMode("idle");
            setCaptured(null);
            setReceiptQuad(null);
            setIsStable(false);
            previousQuadRef.current = null;
            stableFramesRef.current = 0;
        },
        [filename]
    );

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) setImage(dropped);
    };

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        if (picked) setImage(picked);
    };

    const clear = () => {
        setFile(null);
        setFilename("");
        setCaptured(null);
        setMode("idle");
        setReceiptQuad(null);
        setIsStable(false);
        previousQuadRef.current = null;
        stableFramesRef.current = 0;
    };

    const startCamera = () => {
        setCaptured(null);
        setReceiptQuad(null);
        setIsStable(false);
        previousQuadRef.current = null;
        stableFramesRef.current = 0;
        setDebugMessage("Hledám účtenku...");
        setMode("camera");
    };

    const detectReceipt = useCallback(() => {
        const cv = window.cv;
        const screenshot = webcamRef.current?.getScreenshot();
        const overlay = overlayRef.current;

        if (!cv || !screenshot || !overlay) return;

        const img = new Image();
        img.src = screenshot;

        img.onload = () => {
            const tempCanvas = document.createElement("canvas");
            const MAX_WIDTH = 720;
            const scale = Math.min(1, MAX_WIDTH / img.width);

            tempCanvas.width = Math.round(img.width * scale);
            tempCanvas.height = Math.round(img.height * scale);

            const tempCtx = tempCanvas.getContext("2d");
            if (!tempCtx) return;

            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

            const src = cv.imread(tempCanvas);
            const gray = new cv.Mat();
            const blur = new cv.Mat();
            const edges = new cv.Mat();
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();

            let bestApprox: any = null;

            try {
                cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
                cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
                cv.Canny(blur, edges, 60, 180);
                cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

                let bestArea = 0;

                for (let i = 0; i < contours.size(); i++) {
                    const cnt = contours.get(i);
                    const peri = cv.arcLength(cnt, true);
                    const approx = new cv.Mat();

                    cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

                    const area = cv.contourArea(approx);

                    if (
                        approx.rows === 4 &&
                        area > 1200 &&
                        area > bestArea &&
                        cv.isContourConvex(approx)
                    ) {
                        if (bestApprox) bestApprox.delete();
                        bestApprox = approx.clone();
                        bestArea = area;
                    }

                    approx.delete();
                    cnt.delete();
                }

                if (bestApprox) {
                    const points: Point[] = [];
                    for (let i = 0; i < 4; i++) {
                        points.push({
                            x: bestApprox.intPtr(i, 0)[0] / scale,
                            y: bestApprox.intPtr(i, 0)[1] / scale,
                        });
                    }

                    const ordered = orderPoints(points);
                    const stableNow = isQuadStable(previousQuadRef.current, ordered);

                    if (stableNow) {
                        stableFramesRef.current += 1;
                    } else {
                        stableFramesRef.current = 0;
                    }

                    const stableEnough = stableFramesRef.current >= 3;

                    previousQuadRef.current = ordered;
                    setReceiptQuad(ordered);
                    setIsStable(stableEnough);
                    setDebugMessage(stableEnough ? "Účtenka zarovnaná" : "Drž kameru chvíli v klidu");
                    drawOverlay(ordered, img.width, img.height, stableEnough);
                } else {
                    previousQuadRef.current = null;
                    stableFramesRef.current = 0;
                    setReceiptQuad(null);
                    setIsStable(false);
                    setDebugMessage("Hledám účtenku...");
                    drawOverlay(null, img.width, img.height, false);
                }
            } catch (err) {
                console.error("Receipt detection error:", err);
            } finally {
                if (bestApprox) bestApprox.delete();
                src.delete();
                gray.delete();
                blur.delete();
                edges.delete();
                contours.delete();
                hierarchy.delete();
            }
        };
    }, [drawOverlay]);

    useEffect(() => {
        if (mode !== "camera" || !cvReady) return;

        let cancelled = false;

        const loop = () => {
            if (cancelled) return;
            detectReceipt();
            detectTimerRef.current = window.setTimeout(loop, 220);
        };

        loop();

        return () => {
            cancelled = true;
            if (detectTimerRef.current) {
                window.clearTimeout(detectTimerRef.current);
                detectTimerRef.current = null;
            }
        };
    }, [mode, cvReady, detectReceipt]);

    const takePhoto = () => {
        const cv = window.cv;
        const screenshot = webcamRef.current?.getScreenshot();

        if (!screenshot) {
            alert("Nepodařilo se vyfotit. Zkus to znovu.");
            return;
        }

        // fallback: if no cv or no quad, just use raw screenshot
        if (!cv || !receiptQuad || receiptQuad.length !== 4) {
            setCaptured(screenshot);
            setMode("captured");
            return;
        }

        const img = new Image();
        img.src = screenshot;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);

            const src = cv.imread(canvas);
            const dst = new cv.Mat();

            try {
                const [tl, tr, br, bl] = receiptQuad;

                const widthA = distance(br, bl);
                const widthB = distance(tr, tl);
                const maxWidth = Math.max(1, Math.round(Math.max(widthA, widthB)));

                const heightA = distance(tr, br);
                const heightB = distance(tl, bl);
                const maxHeight = Math.max(1, Math.round(Math.max(heightA, heightB)));

                const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                    tl.x, tl.y,
                    tr.x, tr.y,
                    br.x, br.y,
                    bl.x, bl.y,
                ]);

                const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                    0, 0,
                    maxWidth - 1, 0,
                    maxWidth - 1, maxHeight - 1,
                    0, maxHeight - 1,
                ]);

                const matrix = cv.getPerspectiveTransform(srcTri, dstTri);

                cv.warpPerspective(
                    src,
                    dst,
                    matrix,
                    new cv.Size(maxWidth, maxHeight),
                    cv.INTER_LINEAR,
                    cv.BORDER_CONSTANT,
                    new cv.Scalar()
                );

                // optional cleanup to make receipt more readable
                const gray = new cv.Mat();
                cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
                cv.adaptiveThreshold(
                    gray,
                    gray,
                    255,
                    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
                    cv.THRESH_BINARY,
                    21,
                    15
                );

                const outCanvas = document.createElement("canvas");
                outCanvas.width = maxWidth;
                outCanvas.height = maxHeight;
                cv.imshow(outCanvas, gray);

                const flattened = outCanvas.toDataURL("image/jpeg", 0.95);
                setCaptured(flattened);
                setMode("captured");

                srcTri.delete();
                dstTri.delete();
                matrix.delete();
                gray.delete();
            } catch (err) {
                console.error("Perspective crop error:", err);
                setCaptured(screenshot);
                setMode("captured");
            } finally {
                src.delete();
                dst.delete();
            }
        };
    };

    const useCaptured = () => {
        if (!captured) return;
        const base = (filename.trim() || `uctenka-${Date.now()}`).replace(/\.[^/.]+$/, "");
        const f = dataUrlToFile(captured, base);
        setImage(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) return alert("Přetáhni / vyber obrázek nebo vyfoť.");
        if (!filename.trim()) return alert("Zadej název souboru.");
        if (!userId) return alert("Chybí userId (session).");
        if (!path) return alert("Chybí path.");

        const originalExt = file.name.includes(".") ? file.name.split(".").pop() : "";
        const inputName = filename.trim();
        const hasExt =
            originalExt && inputName.toLowerCase().endsWith("." + originalExt.toLowerCase());

        const finalName = originalExt ? (hasExt ? inputName : `${inputName}.${originalExt}`) : inputName;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", finalName);
        formData.append("path", String(path));
        formData.append("userId", String(userId));

        try {
            setLoading(true);

            if (session?.accessToken) {
                const checkRes = await fetch(
                    `https://oauth2.googleapis.com/tokeninfo?access_token=${session.accessToken}`
                );
                const tokeninfo = await checkRes.json();

                if ((tokeninfo.expires_in as number) < 30 || tokeninfo.error === "invalid_token") {
                    await update({});
                }
            }

            const res = await fetch("/api/firestore/Push", {
                method: "POST",
                body: formData,
            });

            const text = await res.text();
            const data = text
                ? (() => {
                    try {
                        return JSON.parse(text);
                    } catch {
                        return { raw: text };
                    }
                })()
                : {};

            if (!res.ok) {
                throw new Error((data as any)?.error || (data as any)?.message || "Chyba při uploadu");
            }

            onUploaded?.(data);
            alert("Obrázek nahrán!");
            clear();
            onClose?.();
        } catch (err: any) {
            alert(err?.message ?? "Něco se pokazilo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div
                onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                }}
                onDrop={onDrop}
                className={[
                    "rounded-3xl border-2 border-dashed p-6 text-center transition",
                    dragOver ? "border-sky-500 bg-sky-50" : "border-gray-300 bg-white/60",
                ].join(" ")}
            >
                <input id="image" type="file" accept="image/*" onChange={onPick} className="hidden" />

                {mode === "camera" && (
                    <div className="flex flex-col gap-3 items-center">
                        <div className="relative w-full h-80 overflow-hidden rounded-2xl border bg-black">
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                screenshotQuality={0.95}
                                videoConstraints={{
                                    facingMode,
                                    aspectRatio: 1.3333333333,
                                }}
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            <canvas
                                ref={overlayRef}
                                className="absolute inset-0 w-full h-full pointer-events-none"
                            />

                            <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                                {cvReady ? debugMessage : "Načítám skener..."}
                            </div>
                        </div>

                        <div className="flex gap-2 justify-center flex-wrap">
                            <button
                                type="button"
                                onClick={() => setMode("idle")}
                                className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition"
                            >
                                Zrušit
                            </button>

                            <button
                                type="button"
                                onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
                                className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition"
                            >
                                Přepnout kameru
                            </button>

                            <button
                                type="button"
                                onClick={takePhoto}
                                className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition disabled:opacity-60"
                                disabled={!cvReady}
                            >
                                {isStable ? "Vyfotit účtenku" : "Vyfotit"}
                            </button>
                        </div>

                        <p className="text-xs text-gray-500">
                            Zarovnej účtenku do záběru. Zelený rámeček znamená, že je dobře nalezená.
                        </p>
                    </div>
                )}

                {mode === "captured" && captured && (
                    <div className="flex flex-col gap-3 items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={captured}
                            alt="captured"
                            className="max-h-72 rounded-2xl border object-contain bg-white"
                        />

                        <div className="flex gap-2 justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setCaptured(null);
                                    setMode("camera");
                                }}
                                className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition"
                            >
                                Znovu
                            </button>
                            <button
                                type="button"
                                onClick={useCaptured}
                                className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition"
                            >
                                Použít fotku
                            </button>
                        </div>
                    </div>
                )}

                {mode === "idle" && !file && (
                    <div className="flex flex-col gap-2 items-center">
                        <p className="text-sm text-gray-600">
                            Přetáhni sem obrázek nebo{" "}
                            <label htmlFor="image" className="text-sky-700 underline cursor-pointer font-semibold">
                                vyber soubor
                            </label>
                        </p>

                        <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition"
                        >
                            Vyfotit účtenku
                        </button>

                        <p className="text-xs text-gray-500">png, jpg, webp, gif</p>
                    </div>
                )}

                {mode === "idle" && file && (
                    <div className="flex flex-col gap-3 items-center">
                        {previewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={previewUrl}
                                alt="preview"
                                className="max-h-48 rounded-2xl border object-contain bg-white"
                            />
                        )}

                        <div className="text-sm text-gray-700 text-left w-full">
                            <div className="truncate">
                                <b>Soubor:</b> {file.name}
                            </div>
                            <div>
                                <b>Velikost:</b> {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                        </div>

                        <button type="button" onClick={clear} className="text-sm text-red-600 underline">
                            Odebrat
                        </button>
                    </div>
                )}
            </div>

            <input
                type="text"
                placeholder="Název obrázku"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="border border-gray-200 bg-white/80 p-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-sky-200"
            />

            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-2xl border border-gray-200 bg-white/80 hover:bg-white text-gray-800 font-semibold text-sm transition"
                >
                    Zrušit
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition disabled:opacity-60"
                >
                    {loading ? "Nahrávám..." : "Nahrát"}
                </button>
            </div>
        </form>
    );
}