import { memo } from "react";
import { Layer, Circle, Rect, RegularPolygon, Group, Text } from "react-konva";
import type { ResolvedPointLayerStyle } from "@/features/canvas-editing/types/layerStyles";
import type { CanvasPointItem, PointLabelColorEntry } from "@/types/serviceTypes";

interface CanvasPointResultLayerProps {
    items: CanvasPointItem[];
    style: ResolvedPointLayerStyle;
    /** Per-label color overrides from layer metadata. Replaces fillColor for matching pointLabel values. */
    labelColorMapping: PointLabelColorEntry[];
}

function resolveFillColor(
    pointLabel: string | undefined,
    mapping: PointLabelColorEntry[],
    fallback: string,
): string {
    if (!pointLabel) return fallback;
    return mapping.find((e) => e.value === pointLabel)?.color ?? fallback;
}

/**
 * Computes the label (x, y) offset from (item.x, item.y) based on placement.
 * Positive Y is downward in canvas/screen space.
 */
function labelOffset(
    placement: string,
    offsetPx: number,
    radius: number,
    borderWidth: number,
): { dx: number; dy: number } {
    const gap = radius + borderWidth + offsetPx;
    switch (placement) {
        case "inside": return { dx: 0, dy: 0 };
        case "outside-left": return { dx: -gap, dy: 0 };
        case "outside-right": return { dx: gap, dy: 0 };
        case "outside-bottom": return { dx: 0, dy: gap };
        case "outside-top":
        default: return { dx: 0, dy: -gap };
    }
}

function _CanvasPointResultLayer({ items, style, labelColorMapping }: CanvasPointResultLayerProps) {
    return (
        <Layer>
            {items.map((item) => {
                if (!item.point) return null;
                const { x, y } = item.point;
                const fill = resolveFillColor(item.pointLabel, labelColorMapping, style.fillColor);

                const markerProps = {
                    fill,
                    stroke: style.borderColor,
                    strokeWidth: style.borderWidth,
                    dash: style.borderDash,
                    listening: false as const,
                    perfectDrawEnabled: false as const,
                };

                const marker = (() => {
                    switch (style.shape) {
                        case "square":
                            return (
                                <Rect
                                    {...markerProps}
                                    x={-style.radius}
                                    y={-style.radius}
                                    width={style.radius * 2}
                                    height={style.radius * 2}
                                />
                            );
                        case "triangle":
                            return <RegularPolygon {...markerProps} sides={3} radius={style.radius} />;
                        case "diamond":
                            return (
                                <RegularPolygon
                                    {...markerProps}
                                    sides={4}
                                    radius={style.radius}
                                    rotation={45}
                                />
                            );
                        case "circle":
                        default:
                            // "cross" falls back to circle — cross requires custom path rendering
                            return <Circle {...markerProps} radius={style.radius} />;
                    }
                })();

                const { dx, dy } = labelOffset(
                    style.labelPlacement,
                    style.labelOffset,
                    style.radius,
                    style.borderWidth,
                );

                return (
                    <Group key={item.id} x={x} y={y}>
                        {marker}
                        {item.pointLabel !== undefined && (
                            <Text
                                x={dx}
                                y={dy}
                                text={String(item.pointLabel)}
                                fill={style.labelColor}
                                fontSize={style.labelFontSize}
                                fontStyle={style.labelFontWeight}
                                align="center"
                                verticalAlign="middle"
                                listening={false}
                                perfectDrawEnabled={false}
                            />
                        )}
                    </Group>
                );
            })}
        </Layer>
    );
}

export const CanvasPointResultLayer = memo(_CanvasPointResultLayer);
