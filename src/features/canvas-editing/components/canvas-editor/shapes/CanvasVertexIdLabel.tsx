import { useState, useLayoutEffect, useRef } from "react";
import { Image } from "react-konva";
import type Konva from "konva";

const LABEL_W = 60;
const LABEL_H = 20;

function contrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b > 0.5 ? "#000000" : "#ffffff";
}

interface CanvasVertexIdLabelProps {
    id: number;
    x: number;
    y: number;
    scale: number;
    accentColor: string;
}

// Pre-render the label to an offscreen HTMLCanvasElement so every Konva frame
// is a single ctx.drawImage() blit instead of running the text pipeline.
// The offscreen canvas is only redrawn when id or colors actually change.
export function CanvasVertexIdLabel({ id, x, y, scale, accentColor }: CanvasVertexIdLabelProps) {
    const labelFill = contrastColor(accentColor);
    const labelStroke = labelFill === "#000000" ? "#ffffff" : "#000000";
    const imageRef = useRef<Konva.Image>(null);

    const [offscreen] = useState<HTMLCanvasElement>(() => {
        const c = document.createElement("canvas");
        const dpr = window.devicePixelRatio || 1;
        c.width = LABEL_W * dpr;
        c.height = LABEL_H * dpr;
        return c;
    });

    useLayoutEffect(() => {
        const dpr = window.devicePixelRatio || 1;
        const ctx = offscreen.getContext("2d")!;
        ctx.clearRect(0, 0, offscreen.width, offscreen.height);
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.font = "bold 12px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = labelStroke;
        ctx.lineWidth = 2;
        ctx.strokeText(String(id), LABEL_W / 2, LABEL_H / 2);
        ctx.fillStyle = labelFill;
        ctx.fillText(String(id), LABEL_W / 2, LABEL_H / 2);
        ctx.restore();
        // Signal the layer to pick up the new canvas content on next draw
        imageRef.current?.getLayer()?.batchDraw();
    }, [id, labelFill, labelStroke, offscreen]);

    return (
        <Image
            ref={imageRef}
            image={offscreen}
            x={x}
            y={y}
            width={LABEL_W / scale}
            height={LABEL_H / scale}
            offsetX={LABEL_W / (2 * scale)}
            offsetY={LABEL_H / (2 * scale)}
            listening={false}
            perfectDrawEnabled={false}
        />
    );
}
