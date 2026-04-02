import { memo } from "react";
import { Layer, Line, Circle, Rect, Group, Text } from "react-konva";
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

function _CanvasPolygonResultLayer({ items, style }: CanvasPolygonResultLayerProps) {
    const showId = style.idPlacement !== "";

    return (
        <Layer>
            {items.map((item) => {
                if (!item.vertices) return null;
                const points = item.vertices.flatMap((v) => [v.x, v.y]);
                // Use centroidPoint for ID label anchor; fall back to first vertex
                const anchor = item.centroidPoint ?? item.vertices[0];
                return (
                    <Group key={item.id}>
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
