import { memo } from "react";
import { Layer, Circle } from "react-konva";
import { useEnvPointStore } from "@/stores/envPointStore";
import { useEnvStore } from "@/stores/envStore";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { LAYER_ID, LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";

export const CanvasEnvPointsLayer = memo(function CanvasEnvPointsLayer() {
    const startPoint = useEnvPointStore((s) => s.startPoint);
    const endPoint = useEnvPointStore((s) => s.endPoint);
    const upsertPoint = useEnvPointStore((s) => s.upsertPoint);
    const envId = useEnvStore((s) => s.env.id);
    const layerSettings = useLayerSettingsStore((s) => s.layers);
    const { activeTool } = useCanvasToolStore();
    const selectedEnvPointType = useCanvasSelectionStore((s) => s.selectedEnvPointType);
    const selectEnvPoint = useCanvasSelectionStore((s) => s.selectEnvPoint);

    const visible = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.VISIBLE) !== "false";

    const startFill = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.START_POINT_COLOR) ?? "#22c55e";
    const startRadius = parseFloat(getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.START_POINT_RADIUS) ?? "8");
    const startStroke = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.START_POINT_STROKE_COLOR) ?? "#166534";

    const endFill = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.END_POINT_COLOR) ?? "#ef4444";
    const endRadius = parseFloat(getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.END_POINT_RADIUS) ?? "8");
    const endStroke = getLayerParam(layerSettings, LAYER_ID.ENV_POINTS, LAYER_PARAM_KEY.END_POINT_STROKE_COLOR) ?? "#991b1b";

    if (!visible) return null;

    const isSelectMode = activeTool === "select";
    const startSelected = selectedEnvPointType === "start";
    const endSelected = selectedEnvPointType === "end";

    return (
        <Layer>
            {startPoint && (
                <Circle
                    x={startPoint.point.x}
                    y={startPoint.point.y}
                    radius={startSelected ? startRadius * 1.4 : startRadius}
                    fill={startFill}
                    stroke={startStroke}
                    strokeWidth={1.5}
                    shadowEnabled={startSelected}
                    shadowColor="rgba(0,0,0,0.6)"
                    shadowBlur={12}
                    shadowOffsetX={0}
                    shadowOffsetY={3}
                    listening={isSelectMode}
                    draggable={isSelectMode}
                    perfectDrawEnabled={startSelected}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        selectEnvPoint("start");
                    }}
                    onDragEnd={(e) => {
                        upsertPoint(envId, "start", { x: e.target.x(), y: e.target.y() });
                    }}
                />
            )}
            {endPoint && (
                <Circle
                    x={endPoint.point.x}
                    y={endPoint.point.y}
                    radius={endSelected ? endRadius * 1.4 : endRadius}
                    fill={endFill}
                    stroke={endStroke}
                    strokeWidth={1.5}
                    shadowEnabled={endSelected}
                    shadowColor="rgba(0,0,0,0.6)"
                    shadowBlur={12}
                    shadowOffsetX={0}
                    shadowOffsetY={3}
                    listening={isSelectMode}
                    draggable={isSelectMode}
                    perfectDrawEnabled={endSelected}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        selectEnvPoint("end");
                    }}
                    onDragEnd={(e) => {
                        upsertPoint(envId, "end", { x: e.target.x(), y: e.target.y() });
                    }}
                />
            )}
        </Layer>
    );
});
