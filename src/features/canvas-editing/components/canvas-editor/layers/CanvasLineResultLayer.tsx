import { memo } from "react";
import { Layer, Line, Group, Circle, Text } from "react-konva";
import type { ResolvedLineLayerStyle } from "@/features/canvas-editing/types/layerStyles";
import type { CanvasLineItem } from "@/types/serviceTypes";

interface CanvasLineResultLayerProps {
    items: CanvasLineItem[];
    style: ResolvedLineLayerStyle;
}

function _CanvasLineResultLayer({ items, style }: CanvasLineResultLayerProps) {
    // Connect-the-dots: collect all item points in array order and render as a single polyline.
    const points = items.flatMap((item) => [item.point.x, item.point.y]);
    const showMarkers = style.pointShape !== "";

    return (
        <Layer>
            <Line
                points={points}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                dash={style.dash}
                lineCap="round"
                lineJoin="round"
                listening={false}
                perfectDrawEnabled={false}
            />
            {showMarkers && items.map((item) => (
                <Group key={item.id} x={item.point.x} y={item.point.y} listening={false}>
                    <Circle
                        radius={style.pointRadius}
                        fill={style.pointFillColor}
                        stroke={style.pointBorderColor || undefined}
                        strokeWidth={style.pointBorderWidth}
                        dash={style.pointBorderDash}
                        perfectDrawEnabled={false}
                    />
                    {style.pointIdPlacement === "inside" && (
                        <Text
                            text={String(item.id)}
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
                    {style.pointLabelPlacement !== "" && item.pointLabel !== undefined && (
                        <Text
                            text={String(item.pointLabel)}
                            fill={style.pointLabelColor}
                            fontSize={style.pointLabelFontSize}
                            fontStyle={style.pointLabelFontWeight}
                            offsetX={style.pointRadius + style.pointLabelOffset}
                            offsetY={style.pointLabelFontSize / 2}
                            listening={false}
                        />
                    )}
                </Group>
            ))}
        </Layer>
    );
}

export const CanvasLineResultLayer = memo(_CanvasLineResultLayer);
