import { memo } from "react";
import { Layer, Line } from "react-konva";
import type { ResolvedLineLayerStyle } from "@/features/canvas-editing/types/layerStyles";
import type { CanvasPathItem } from "@/types/serviceTypes";

interface CanvasPathResultLayerProps {
    items: CanvasPathItem[];
    style: ResolvedLineLayerStyle;
}

// Transit segments always render dashed regardless of the configured edge style,
// since "transit" means the tool is not engaged. Coverage segments use the
// configured dash pattern.
const TRANSIT_DASH = [6, 4];

function _CanvasPathResultLayer({ items, style }: CanvasPathResultLayerProps) {
    return (
        <Layer>
            {items.map((item) => {
                const points = item.path.flatMap((p) => [p.x, p.y]);
                const dash = item.type === "transit" ? TRANSIT_DASH : style.dash;
                return (
                    <Line
                        key={item.id}
                        points={points}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        dash={dash}
                        lineCap="round"
                        lineJoin="round"
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                );
            })}
        </Layer>
    );
}

export const CanvasPathResultLayer = memo(_CanvasPathResultLayer);
