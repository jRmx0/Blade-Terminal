import { memo } from "react";
import { Layer, Group, Text } from "react-konva";
import { MarkerShape } from "@/features/canvas-editing/utils/markerShape";
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

/**
 * When multiple items share the same point (same pointLabel / centroid),
 * spreads them in a grid pattern so they don't overlap.
 * Returns per-item {dx, dy} offsets relative to the shared point.
 */
function computeOverlapOffsets(
    items: CanvasPointItem[],
    spacing: number,
    layout: string,
): Map<number, { dx: number; dy: number }> {
    const offsets = new Map<number, { dx: number; dy: number }>();
    if (!spacing || layout !== "grid") {
        items.forEach((item) => offsets.set(item.id, { dx: 0, dy: 0 }));
        return offsets;
    }

    // Group items by position key
    const groups = new Map<string, CanvasPointItem[]>();
    for (const item of items) {
        if (!item.point) continue;
        const key = `${item.point.x},${item.point.y}`;
        const group = groups.get(key);
        if (group) group.push(item);
        else groups.set(key, [item]);
    }

    for (const group of groups.values()) {
        const n = group.length;
        const cols = Math.ceil(Math.sqrt(n));
        group.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const totalCols = Math.min(cols, n - row * cols);
            const dx = (col - (totalCols - 1) / 2) * spacing;
            const dy = (row - (Math.ceil(n / cols) - 1) / 2) * spacing;
            offsets.set(item.id, { dx, dy });
        });
    }
    return offsets;
}

function _CanvasPointResultLayer({ items, style, labelColorMapping }: CanvasPointResultLayerProps) {
    const overlapOffsets = computeOverlapOffsets(items, style.overlapSpacing, style.overlapLayout);
    const showId = style.idPlacement !== "";
    const showLabel = style.labelPlacement !== "";

    return (
        <Layer>
            {/* ── Shape pass: all markers rendered before any text ── */}
            {items.map((item) => {
                if (!item.point) return null;
                const { dx: odx, dy: ody } = overlapOffsets.get(item.id) ?? { dx: 0, dy: 0 };
                const fill = resolveFillColor(item.pointLabel, labelColorMapping, style.fillColor);
                return (
                    <Group key={`s-${item.id}`} x={item.point.x + odx} y={item.point.y + ody}>
                        <MarkerShape
                            shape={style.shape}
                            radius={style.radius}
                            fill={fill}
                            stroke={style.borderColor}
                            strokeWidth={style.borderWidth}
                            dash={style.borderDash}
                            listening={false}
                            perfectDrawEnabled={false}
                        />
                    </Group>
                );
            })}
            {/* ── Text pass: all ID and label text rendered above all markers ── */}
            {(showId || showLabel) && items.map((item) => {
                if (!item.point) return null;
                const { dx: odx, dy: ody } = overlapOffsets.get(item.id) ?? { dx: 0, dy: 0 };
                const idOff = showId ? (() => {
                    const gap = style.radius + style.borderWidth + style.idOffset;
                    switch (style.idPlacement) {
                        case "inside": return { dx: 0, dy: 0 };
                        case "outside-left": return { dx: -gap, dy: 0 };
                        case "outside-right": return { dx: gap, dy: 0 };
                        case "outside-bottom": return { dx: 0, dy: gap };
                        case "outside-top":
                        default: return { dx: 0, dy: -gap };
                    }
                })() : null;
                const { dx: ldx, dy: ldy } = labelOffset(
                    style.labelPlacement,
                    style.labelOffset,
                    style.radius,
                    style.borderWidth,
                );
                return (
                    <Group key={`t-${item.id}`} x={item.point.x + odx} y={item.point.y + ody}>
                        {showId && idOff !== null && (
                            <Text
                                x={idOff.dx}
                                y={idOff.dy}
                                text={String(item.id)}
                                fill={style.idColor}
                                fontSize={style.idFontSize}
                                fontStyle={style.idFontWeight}
                                width={style.idFontSize * 4}
                                height={style.idFontSize * 1.5}
                                offsetX={style.idFontSize * 2}
                                offsetY={style.idFontSize * 0.75}
                                align="center"
                                verticalAlign="middle"
                                listening={false}
                                perfectDrawEnabled={false}
                            />
                        )}
                        {showLabel && item.pointLabel !== undefined && (
                            <Text
                                x={ldx}
                                y={ldy}
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
