import { memo, Fragment } from "react";
import { Layer, Line, Group, Text } from "react-konva";
import { MarkerShape } from "@/features/canvas-editing/utils/markerShape";
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

function waypointIdOffset(
    placement: string,
    gap: number,
): { dx: number; dy: number } {
    switch (placement) {
        case "inside": return { dx: 0, dy: 0 };
        case "outside-left": return { dx: -gap, dy: 0 };
        case "outside-right": return { dx: gap, dy: 0 };
        case "outside-bottom": return { dx: 0, dy: gap };
        case "outside-top":
        default: return { dx: 0, dy: -gap };
    }
}

function _CanvasPathResultLayer({ items, style }: CanvasPathResultLayerProps) {
    const arrowSize = style.arrowSize;
    const showMarkers = style.pointShape !== "";
    const showId = style.pointIdPlacement !== "";

    return (
        <Layer>
            {/* ── Shape pass: polylines, arrows, and waypoint markers ── */}
            {items.map((item) => {
                const flatPoints = item.path.flatMap((p) => [p.point.x, p.point.y]);
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
                    <Fragment key={`s-${item.id}`}>
                        <Line
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
                            <Line points={startArrowPts} closed={!isNotchArrow(style.arrowStart)} fill={style.stroke} {...arrowStrokeProps} />
                        )}
                        {endArrowPts && (
                            <Line points={endArrowPts} closed={!isNotchArrow(style.arrowEnd)} fill={style.stroke} {...arrowStrokeProps} />
                        )}
                        {midArrows.map((pts, mi) => (
                            <Line key={mi} points={pts} closed={!isNotchArrow(style.arrowMid)} fill={style.stroke} {...arrowStrokeProps} />
                        ))}
                        {showMarkers && item.path.map((wp) => (
                            <Group key={`${item.id}-wp-${wp.id}`} x={wp.point.x} y={wp.point.y} listening={false}>
                                <MarkerShape
                                    shape={style.pointShape}
                                    radius={style.pointRadius}
                                    fill={style.pointFillColor}
                                    stroke={style.pointBorderColor || undefined}
                                    strokeWidth={style.pointBorderWidth}
                                    dash={style.pointBorderDash}
                                    listening={false}
                                    perfectDrawEnabled={false}
                                />
                            </Group>
                        ))}
                    </Fragment>
                );
            })}
            {/* ── Text pass: waypoint ID texts rendered above all markers ── */}
            {showMarkers && showId && items.map((item) => (
                <Fragment key={`t-${item.id}`}>
                    {item.path.map((wp) => {
                        const gap = style.pointRadius + style.pointBorderWidth + style.pointIdOffset;
                        const off = waypointIdOffset(style.pointIdPlacement, gap);
                        return (
                            <Group key={`${item.id}-wpt-${wp.id}`} x={wp.point.x} y={wp.point.y} listening={false}>
                                {style.pointIdPlacement === "inside" ? (
                                    <Text
                                        text={String(wp.id)}
                                        fill={style.pointIdColor}
                                        fontSize={style.pointIdFontSize}
                                        fontStyle={style.pointIdFontWeight}
                                        width={style.pointIdFontSize * 4}
                                        height={style.pointIdFontSize * 1.5}
                                        offsetX={style.pointIdFontSize * 2}
                                        offsetY={style.pointIdFontSize * 0.75}
                                        align="center"
                                        verticalAlign="middle"
                                        listening={false}
                                    />
                                ) : (
                                    <Text
                                        text={String(wp.id)}
                                        fill={style.pointIdColor}
                                        fontSize={style.pointIdFontSize}
                                        fontStyle={style.pointIdFontWeight}
                                        x={off.dx}
                                        y={off.dy}
                                        offsetY={style.pointIdFontSize / 2}
                                        listening={false}
                                    />
                                )}
                            </Group>
                        );
                    })}
                </Fragment>
            ))}
        </Layer>
    );
}

export const CanvasPathResultLayer = memo(_CanvasPathResultLayer);
