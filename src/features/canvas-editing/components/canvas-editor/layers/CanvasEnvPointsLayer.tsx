import { memo, useState } from "react";
import { Layer, Circle } from "react-konva";
import { useEnvPointStore } from "@/stores/envPointStore";
import { useEnvStore } from "@/stores/envStore";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { LAYER_ID, LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";
import type { EnvPointType } from "@/types/schemaTypes";

export const CanvasEnvPointsLayer = memo(function CanvasEnvPointsLayer({
    onEnvPointHoverChange,
}: {
    onEnvPointHoverChange: (hovering: boolean) => void;
}) {
    const startPoint = useEnvPointStore((s) => s.startPoint);
    const endPoint = useEnvPointStore((s) => s.endPoint);
    const startEndPoint = useEnvPointStore((s) => s.startEndPoint);
    const upsertPoint = useEnvPointStore((s) => s.upsertPoint);
    const envId = useEnvStore((s) => s.env.id);
    const layerSettings = useLayerSettingsStore((s) => s.layers);
    const { activeTool } = useCanvasToolStore();
    const selectedEnvPointType = useCanvasSelectionStore((s) => s.selectedEnvPointType);
    const selectEnvPoint = useCanvasSelectionStore((s) => s.selectEnvPoint);
    const clearSelection = useCanvasSelectionStore((s) => s.clearSelection);

    const [draggingType, setDraggingType] = useState<EnvPointType | null>(null);

    const visible = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.VISIBLE) !== "false";

    const startFill = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.START_POINT_COLOR) ?? "#22c55e";
    const startRadius = parseFloat(getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.START_POINT_RADIUS) ?? "8");
    const startStroke = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.START_POINT_STROKE_COLOR) ?? "#166534";

    const endFill = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.END_POINT_COLOR) ?? "#ef4444";
    const endRadius = parseFloat(getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.END_POINT_RADIUS) ?? "8");
    const endStroke = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.END_POINT_STROKE_COLOR) ?? "#991b1b";

    const startEndFill = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.START_END_POINT_COLOR) ?? "#a855f7";
    const startEndRadius = parseFloat(getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.START_END_POINT_RADIUS) ?? "8");
    const startEndStroke = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.START_END_POINT_STROKE_COLOR) ?? "#6b21a8";

    if (!visible) return null;

    const isSelectMode = activeTool === "select";
    const startActive = selectedEnvPointType === "start" || draggingType === "start";
    const endActive = selectedEnvPointType === "end" || draggingType === "end";
    const startEndActive = selectedEnvPointType === "start_end" || draggingType === "start_end";

    return (
        <Layer>
            {startPoint && (
                <Circle
                    x={startPoint.point.x}
                    y={startPoint.point.y}
                    radius={startActive ? startRadius * 1.4 : startRadius}
                    fill={startFill}
                    stroke={startStroke}
                    strokeWidth={1.5}
                    shadowEnabled={startActive}
                    shadowColor="rgba(0,0,0,0.6)"
                    shadowBlur={12}
                    shadowOffsetX={0}
                    shadowOffsetY={3}
                    listening={isSelectMode}
                    draggable={isSelectMode}
                    perfectDrawEnabled={startActive}
                    onMouseEnter={() => isSelectMode && onEnvPointHoverChange(true)}
                    onMouseLeave={() => onEnvPointHoverChange(false)}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        selectEnvPoint("start");
                    }}
                    onDragStart={() => { clearSelection(); setDraggingType("start"); }}
                    onDragEnd={(e) => {
                        setDraggingType(null);
                        upsertPoint(envId, "start", { x: e.target.x(), y: e.target.y() });
                    }}
                />
            )}
            {endPoint && (
                <Circle
                    x={endPoint.point.x}
                    y={endPoint.point.y}
                    radius={endActive ? endRadius * 1.4 : endRadius}
                    fill={endFill}
                    stroke={endStroke}
                    strokeWidth={1.5}
                    shadowEnabled={endActive}
                    shadowColor="rgba(0,0,0,0.6)"
                    shadowBlur={12}
                    shadowOffsetX={0}
                    shadowOffsetY={3}
                    listening={isSelectMode}
                    draggable={isSelectMode}
                    perfectDrawEnabled={endActive}
                    onMouseEnter={() => isSelectMode && onEnvPointHoverChange(true)}
                    onMouseLeave={() => onEnvPointHoverChange(false)}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        selectEnvPoint("end");
                    }}
                    onDragStart={() => { clearSelection(); setDraggingType("end"); }}
                    onDragEnd={(e) => {
                        setDraggingType(null);
                        upsertPoint(envId, "end", { x: e.target.x(), y: e.target.y() });
                    }}
                />
            )}
            {startEndPoint && (
                <Circle
                    x={startEndPoint.point.x}
                    y={startEndPoint.point.y}
                    radius={startEndActive ? startEndRadius * 1.4 : startEndRadius}
                    fill={startEndFill}
                    stroke={startEndStroke}
                    strokeWidth={1.5}
                    shadowEnabled={startEndActive}
                    shadowColor="rgba(0,0,0,0.6)"
                    shadowBlur={12}
                    shadowOffsetX={0}
                    shadowOffsetY={3}
                    listening={isSelectMode}
                    draggable={isSelectMode}
                    perfectDrawEnabled={startEndActive}
                    onMouseEnter={() => isSelectMode && onEnvPointHoverChange(true)}
                    onMouseLeave={() => onEnvPointHoverChange(false)}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        selectEnvPoint("start_end");
                    }}
                    onDragStart={() => { clearSelection(); setDraggingType("start_end"); }}
                    onDragEnd={(e) => {
                        setDraggingType(null);
                        upsertPoint(envId, "start_end", { x: e.target.x(), y: e.target.y() });
                    }}
                />
            )}
        </Layer>
    );
});
