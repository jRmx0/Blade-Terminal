import { memo } from "react";
import { Layer, Line, Circle, Rect, Group, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { ResolvedPolygonResultLayerStyle } from "@/features/canvas-editing/types/layerStyles";
import type { CanvasPolygonItem } from "@/types/serviceTypes";

interface CanvasPolygonResultLayerProps {
    items: CanvasPolygonItem[];
    style: ResolvedPolygonResultLayerStyle;
}

/** Renders the ID badge at the anchor point for a given item. */
function IdBadge({
    x,
    y,
    id,
    style,
}: {
    x: number;
    y: number;
    id: number;
    style: ResolvedPolygonResultLayerStyle;
}) {
    const text = String(id);
    const background = (() => {
        if (!style.idShape) return null;
        const bgProps = {
            fill: style.idFillColor,
            stroke: style.idBorderColor,
            strokeWidth: style.idBorderWidth,
            dash: style.idBorderDash,
            listening: false as const,
            perfectDrawEnabled: false as const,
        };
        if (style.idShape === "square") {
            const half = style.idRadius;
            return <Rect {...bgProps} x={-half} y={-half} width={half * 2} height={half * 2} />;
        }
        return <Circle {...bgProps} radius={style.idRadius} />;
    })();

    return (
        <Group x={x} y={y}>
            {background}
            <Text
                text={text}
                fill={style.idColor}
                fontSize={style.idFontSize}
                fontStyle={style.idFontWeight}
                align="center"
                verticalAlign="middle"
                listening={false}
                perfectDrawEnabled={false}
            />
        </Group>
    );
}

/** Renders a single corner-vertex marker. */
function VertexMarker({
    x,
    y,
    style,
}: {
    x: number;
    y: number;
    style: ResolvedPolygonResultLayerStyle;
}) {
    const markerProps = {
        fill: style.vertexFillColor,
        stroke: style.vertexBorderColor,
        strokeWidth: style.vertexBorderWidth,
        dash: style.vertexBorderDash,
        listening: false as const,
        perfectDrawEnabled: false as const,
    };

    const shape = (() => {
        switch (style.vertexShape) {
            case "square": {
                const half = style.vertexRadius;
                return <Rect {...markerProps} x={-half} y={-half} width={half * 2} height={half * 2} />;
            }
            case "circle":
            default:
                return <Circle {...markerProps} radius={style.vertexRadius} />;
        }
    })();

    const showVertexId = style.vertexIdPlacement !== "";
    const idOffset = (() => {
        if (!showVertexId) return null;
        const gap = style.vertexRadius + style.vertexBorderWidth + style.vertexIdOffset;
        switch (style.vertexIdPlacement) {
            case "inside": return { dx: 0, dy: 0 };
            case "outside-left": return { dx: -gap, dy: 0 };
            case "outside-right": return { dx: gap, dy: 0 };
            case "outside-bottom": return { dx: 0, dy: gap };
            case "outside-top":
            default: return { dx: 0, dy: -gap };
        }
    })();

    return (
        <Group x={x} y={y}>
            {shape}
            {showVertexId && idOffset !== null && (
                <Text
                    x={idOffset.dx}
                    y={idOffset.dy}
                    text=""
                    fill={style.vertexIdColor}
                    fontSize={style.vertexIdFontSize}
                    fontStyle={style.vertexIdFontWeight}
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                    perfectDrawEnabled={false}
                />
            )}
        </Group>
    );
}

function _CanvasPolygonResultLayer({ items, style }: CanvasPolygonResultLayerProps) {
    const showId = style.idPlacement !== "";
    const showVertices = style.vertexShape !== "";
    // fillStyle "hatched" renders diagonal stripes using two overlapping fills
    const isHatched = style.fillStyle === "hatched";

    return (
        <Layer>
            {items.map((item) => {
                if (!item.vertices) return null;
                const points = item.vertices.flatMap((v) => [v.x, v.y]);
                const anchor = item.centroidPoint ?? item.vertices[0];
                return (
                    <Group key={item.id}>
                        {/* Base polygon fill */}
                        <Line
                            points={points}
                            closed
                            fill={style.fill}
                            stroke={style.stroke}
                            strokeWidth={style.strokeWidth}
                            dash={style.dash}
                            lineCap="round"
                            lineJoin="round"
                            listening={false}
                            perfectDrawEnabled={false}
                        />
                        {/* Hatched overlay — 45° diagonal stripe using fillPatternImage approx via repeated lines */}
                        {isHatched && (
                            <Line
                                points={points}
                                closed
                                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                                fillLinearGradientEndPoint={{ x: 8, y: 8 }}
                                fillLinearGradientColorStops={[
                                    0, style.fill,
                                    0.4999, style.fill,
                                    0.5, "transparent",
                                    1, "transparent",
                                ]}
                                stroke=""
                                strokeWidth={0}
                                listening={false}
                                perfectDrawEnabled={false}
                            />
                        )}
                        {/* Corner vertex markers */}
                        {showVertices && item.vertices.map((v, vi) => (
                            <VertexMarker key={vi} x={v.x} y={v.y} style={style} />
                        ))}
                        {/* Polygon ID badge */}
                        {showId && anchor !== undefined && (
                            <IdBadge
                                x={anchor.x + style.idOffset}
                                y={anchor.y + style.idOffset}
                                id={item.id}
                                style={style}
                            />
                        )}
                    </Group>
                );
            })}
        </Layer>
    );
}

export const CanvasPolygonResultLayer = memo(_CanvasPolygonResultLayer);
