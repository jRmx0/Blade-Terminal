import { memo } from "react";
import { Layer, Line, Group, Circle, Rect, RegularPolygon, Shape, Text } from "react-konva";
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
    const showMarkers = style.pointShape !== "";
    const showId = style.pointIdPlacement !== "";

    return (
        <Layer>
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
                        {showMarkers && item.path.map((wp) => {
                            const gap = style.pointRadius + style.pointBorderWidth + style.pointIdOffset;
                            const idOffset = (() => {
                                switch (style.pointIdPlacement) {
                                    case "inside": return { dx: 0, dy: 0 };
                                    case "outside-left": return { dx: -gap, dy: 0 };
                                    case "outside-right": return { dx: gap, dy: 0 };
                                    case "outside-bottom": return { dx: 0, dy: gap };
                                    case "outside-top":
                                    default: return { dx: 0, dy: -gap };
                                }
                            })();

                            const markerProps = {
                                fill: style.pointFillColor,
                                stroke: style.pointBorderColor || undefined,
                                strokeWidth: style.pointBorderWidth,
                                dash: style.pointBorderDash,
                                listening: false as const,
                                perfectDrawEnabled: false as const,
                            };
                            const marker = (() => {
                                switch (style.pointShape) {
                                    case "square":
                                        return <Rect {...markerProps} x={-style.pointRadius} y={-style.pointRadius} width={style.pointRadius * 2} height={style.pointRadius * 2} />;
                                    case "triangle":
                                        return <RegularPolygon {...markerProps} sides={3} radius={style.pointRadius} />;
                                    case "diamond":
                                        return <RegularPolygon {...markerProps} sides={4} radius={style.pointRadius} />;
                                    case "cross": {
                                        const aw = style.pointRadius * 0.2;
                                        const al = style.pointRadius;
                                        return (
                                            <Shape
                                                {...markerProps}
                                                rotation={45}
                                                sceneFunc={(ctx, shape) => {
                                                    ctx.beginPath();
                                                    ctx.moveTo(-aw, -al);
                                                    ctx.lineTo(aw, -al);
                                                    ctx.lineTo(aw, -aw);
                                                    ctx.lineTo(al, -aw);
                                                    ctx.lineTo(al, aw);
                                                    ctx.lineTo(aw, aw);
                                                    ctx.lineTo(aw, al);
                                                    ctx.lineTo(-aw, al);
                                                    ctx.lineTo(-aw, aw);
                                                    ctx.lineTo(-al, aw);
                                                    ctx.lineTo(-al, -aw);
                                                    ctx.lineTo(-aw, -aw);
                                                    ctx.closePath();
                                                    ctx.fillStrokeShape(shape);
                                                }}
                                            />
                                        );
                                    }
                                    case "circle":
                                    default:
                                        return <Circle {...markerProps} radius={style.pointRadius} />;
                                }
                            })();

                            return (
                                <Group key={`${item.id}-wp-${wp.id}`} x={wp.point.x} y={wp.point.y} listening={false}>
                                    {marker}
                                    {showId && style.pointIdPlacement === "inside" && (
                                        <Text
                                            text={String(wp.id)}
                                            fill={style.pointIdColor}
                                            fontSize={style.pointIdFontSize}
                                            fontStyle={style.pointIdFontWeight}
                                            width={style.pointRadius * 2}
                                            height={style.pointRadius * 2}
                                            offsetX={style.pointRadius}
                                            offsetY={style.pointRadius}
                                            align="center"
                                            verticalAlign="middle"
                                            listening={false}
                                        />
                                    )}
                                    {showId && style.pointIdPlacement !== "inside" && (
                                        <Text
                                            text={String(wp.id)}
                                            fill={style.pointIdColor}
                                            fontSize={style.pointIdFontSize}
                                            fontStyle={style.pointIdFontWeight}
                                            x={idOffset.dx}
                                            y={idOffset.dy}
                                            offsetY={style.pointIdFontSize / 2}
                                            listening={false}
                                        />
                                    )}
                                </Group>
                            );
                        })}
                    </>
                );
            })}
        </Layer>
    );
}

export const CanvasPathResultLayer = memo(_CanvasPathResultLayer);
