"use client";

import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";

// Load Camera only on the client
const Camera = dynamic(() => import("react-camera-pro").then((m) => m.Camera), {
    ssr: false,
});

type Props = {
    onCapture?: (dataUrl: string) => void; // optional callback to parent
};

export default function FotoCamera({ onCapture }: Props) {
    const cameraRef = useRef<any>(null);
    const [image, setImage] = useState<string | null>(null);

    const takePicture = () => {
        if (!cameraRef.current) return;
        const photo: string = cameraRef.current.takePhoto(); // base64 data URL
        setImage(photo);
        onCapture?.(photo);
    };

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <Camera
                ref={cameraRef}
                errorMessages={{
                    noCameraAccessible: "No camera accessible",
                    permissionDenied: "Camera permission denied",
                    switchCamera: "Cannot switch camera",
                    canvas: "Canvas not supported",
                }}
            />

            <button type="button" onClick={takePicture}>
                Take photo
            </button>

            {image && <img src={image} alt="Taken photo" style={{ width: "100%" }} />}
        </div>
    );
}