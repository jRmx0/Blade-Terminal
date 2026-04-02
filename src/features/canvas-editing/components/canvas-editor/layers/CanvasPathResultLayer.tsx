import { memo } from "react";
import { Layer, Line } from "react-konva";
import type { ResolvedLineLayerStyle } from "@/features/canvas-editing/types/layerStyles";
import type { CanvasPathItem } from "@/types/serviceTypes";
import {
    arrowHeadPoints,
    interpolatePolyline,
    isNotchArrow,
    isStartArrow,
    midArrowPositions,
    polylineLength,
} from "@/features/canvas-editing/utils/arrowUtils";

interface CanvasPathResultLayerProps {
    items: CanvasPathItem[];
    style: ResolvedLineLayerStyle;
}

// Transit segments always render dashed regardless of the configured edge style,
// since "transit" means the tool is not engaged.
const TRANSIT_DASH = [6, 4];

function _CanvasPathResultLayer({ items, style }: CanvasPathResultLayerProps) {
    const arrowSize = style.arrowSize;

    return (
        <Layer>
            {items.map((item) => {
                const flatPoints = item.path.flatMap((p) => [p.x, p.y]);
                const dash = item.type === "transit" ? TRANSIT_DASH : style.dash;
                const hasArrows = flatPoints.length >= 4 && arrowSize > 0;
                const totalLen = hasArrows ? polylineLength(flatPoints) : 0;

                const startArrowPts =
                    hasArrows && style.arrowStart
                        ? (() => {
                            const { point, angle } = interpolatePolyline(flatPoints, 0);
                            const dir = isStartArrow(style.arrowStart) ? angle + Math.PI : angle;
                            return arrowHeadPoints(point.x, point.y, dir, arrowSize, isNotchArrow(style.arrowStart));
                        })()
                        : null;

                const endArrowPts =
                    hasArrows && style.arrowEnd
                        ? (() => {
                            const { point, angle } = interpolatePolyline(flatPoints, 1);
                            const dir = isStartArrow(style.arrowEnd) ? angle + Math.PI : angle;
                            return arrowHeadPoints(point.x, point.y, dir, arrowSize, isNotchArrow(style.arrowEnd));
                        })()
                        : null;

                const midArrows =
                    hasArrows && style.arrowMid && style.arrowMidSpacing > 0
                        ? midArrowPositions(totalLen, style.arrowMidSpacing).map((t) => {
                            const { point, angle } = interpolatePolyline(flatPoints, t);
                            const dir = isStartArrow(style.arrowMid) ? angle + Math.PI : angle;
                            return arrowHeadPoints(point.x, point.y, dir, arrowSize, isNotchArrow(style.arrowMid));
                        })
                        : [];

                const arrowStrokeProps = {
                    stroke: style.stroke,
                    strokeWidth: style.strokeWidth,
                    lineCap: "round" as const,
                    lineJoin: "round" as const,
                    listening: false as const,
                    perfectDrawEnabled: false as const,
                };

                return (
                    <>
                        <Line
                            key={item.id}
                            points={flatPoints}
                            stroke={style.stroke}
                            strokeWidth={style.strokeWidth}
                            dash={dash}
                            lineCap="round"
                            lineJoin="round"
                            listening={false}
                            perfectDrawEnabled={false}
                        />
                        {startArrowPts && (
                            <Line key={`${item.id}-as`} points={startArrowPts} closed={!isNotchArrow(style.arrowStart)} fill={style.stroke} {...arrowStrokeProps} />
                        )}
                        {endArrowPts && (
                            <Line key={`${item.id}-ae`} points={endArrowPts} closed={!isNotchArrow(style.arrowEnd)} fill={style.stroke} {...arrowStrokeProps} />
                        )}
                        {midArrows.map((pts, mi) => (
                            <Line key={`${item.id}-am${mi}`} points={pts} closed={!isNotchArrow(style.arrowMid)} fill={style.stroke} {...arrowStrokeProps} />
                        ))}
                    </>
                );
            })}
        </Layer>
    );
}

export const CanvasPathResultLayer = memo(_CanvasPathResultLayer);
