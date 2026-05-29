import { memo } from "react";
import { Layer, Line, Circle, Group } from "react-konva";
import { useCoverageReplayStore } from "@/features/coverage-replay/stores/useCoverageReplayStore";
import { useComputeResultStore } from "@/stores/useComputeResultStore";
import { useLayerSettingsStore, getLayerParam } from "@/stores/layerSettingsStore";
import { LAYER_ID, LAYER_PARAM_KEY } from "@/config/layers/layerRegistry";

/**
 * Konva Layer that renders the animated coverage path brush strokes.
 *
 * Rendering rules:
 * - All shapes use `listening={false}` and `perfectDrawEnabled={false}` for performance.
 * - `strokeWidth` is in world units — Konva's Stage scale transform handles
 *   pixel-level rendering, keeping the brush proportional at all zoom levels.
 * - Semi-transparent brush strokes accumulate opacity naturally via Konva's
 *   default `source-over` compositing wherever segments overlap.
 * - Returns an empty `<Layer />` when replay mode is inactive so the Stage
 *   layer count stays constant and no re-mount occurs.
 * - Brush color/width and marker settings are read from layerSettingsStore
 *   (LAYER_ID.COVERAGE_REPLAY) so they persist to the DB and appear in LayerRow.
 */
function _CanvasCoverageReplayLayer() {
    const isReplayMode = useCoverageReplayStore((s) => s.isReplayMode);
    const isPlaying = useCoverageReplayStore((s) => s.isPlaying);
    const committedLines = useCoverageReplayStore((s) => s.committedLines);
    const activeLinePoints = useCoverageReplayStore((s) => s.activeLinePoints);
    const currentDistance = useCoverageReplayStore((s) => s.currentDistance);

    const layerSettings = useLayerSettingsStore((s) => s.layers);
    const pathWidth = useComputeResultStore((s) => s.coverageMetrics.pathWidth);

    const visible = getLayerParam(layerSettings, LAYER_ID.COVERAGE_REPLAY, LAYER_PARAM_KEY.VISIBLE) !== "false";

    if (!isReplayMode || !visible) return <Layer />;

    // ── Brush settings ────────────────────────────────────────────────────────
    const brushColor = getLayerParam(layerSettings, LAYER_ID.COVERAGE_REPLAY, LAYER_PARAM_KEY.REPLAY_BRUSH_COLOR) ?? "#22c55e99";
    const brushWidthRaw = parseFloat(getLayerParam(layerSettings, LAYER_ID.COVERAGE_REPLAY, LAYER_PARAM_KEY.REPLAY_BRUSH_WIDTH) ?? "0");
    // Effective stroke width in world units. Falls back to pathWidth or 1.
    const effectiveBrushWidth = brushWidthRaw > 0 ? brushWidthRaw : (pathWidth ?? 1);

    // ── Marker settings ───────────────────────────────────────────────────────
    const startMarkerShow = getLayerParam(layerSettings, LAYER_ID.COVERAGE_REPLAY, LAYER_PARAM_KEY.REPLAY_START_MARKER_SHOW) !== "false";
    const startMarkerFill = getLayerParam(layerSettings, LAYER_ID.COVERAGE_REPLAY, LAYER_PARAM_KEY.REPLAY_START_MARKER_FILL_COLOR) ?? "#22c55e";
    const startMarkerBorder = getLayerParam(layerSettings, LAYER_ID.COVERAGE_REPLAY, LAYER_PARAM_KEY.REPLAY_START_MARKER_BORDER_COLOR) ?? "#15803d";
    const startMarkerSize = parseFloat(getLayerParam(layerSettings, LAYER_ID.COVERAGE_REPLAY, LAYER_PARAM_KEY.REPLAY_START_MARKER_SIZE) ?? "2");

    const endMarkerShow = getLayerParam(layerSettings, LAYER_ID.COVERAGE_REPLAY, LAYER_PARAM_KEY.REPLAY_END_MARKER_SHOW) !== "false";
    const endMarkerFill = getLayerParam(layerSettings, LAYER_ID.COVERAGE_REPLAY, LAYER_PARAM_KEY.REPLAY_END_MARKER_FILL_COLOR) ?? "#ef4444";
    const endMarkerBorder = getLayerParam(layerSettings, LAYER_ID.COVERAGE_REPLAY, LAYER_PARAM_KEY.REPLAY_END_MARKER_BORDER_COLOR) ?? "#b91c1c";
    const endMarkerSize = parseFloat(getLayerParam(layerSettings, LAYER_ID.COVERAGE_REPLAY, LAYER_PARAM_KEY.REPLAY_END_MARKER_SIZE) ?? "2");

    // ── Path geometry ─────────────────────────────────────────────────────────
    // Derive start point from first committed line or active line
    const firstCommitted = committedLines[0];
    const startX =
        firstCommitted && firstCommitted.points.length >= 2
            ? firstCommitted.points[0]!
            : activeLinePoints.length >= 2
                ? activeLinePoints[0]!
                : null;
    const startY =
        firstCommitted && firstCommitted.points.length >= 2
            ? firstCommitted.points[1]!
            : activeLinePoints.length >= 2
                ? activeLinePoints[1]!
                : null;

    // Derive end point from the tip of the active line (or last committed)
    const lastActive =
        activeLinePoints.length >= 2 ? activeLinePoints : null;
    const lastCommitted = committedLines[committedLines.length - 1];
    const endSource = lastActive ?? lastCommitted?.points ?? null;
    const endX =
        endSource && endSource.length >= 2
            ? endSource[endSource.length - 2]!
            : null;
    const endY =
        endSource && endSource.length >= 2
            ? endSource[endSource.length - 1]!
            : null;

    // Show end marker only once animation has completed (not playing)
    const showEndMarker =
        endMarkerShow &&
        !isPlaying &&
        currentDistance > 0 &&
        endX !== null &&
        endY !== null;

    return (
        <Layer>
            {/* ── Committed segment lines ── */}
            {committedLines.map((line, i) => {
                const lineEl = (
                    <Line
                        points={line.points}
                        stroke={brushColor}
                        strokeWidth={effectiveBrushWidth}
                        lineCap="round"
                        lineJoin="round"
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                );
                if (i === 0) return <Group key={i}>{lineEl}</Group>;

                // For segment N (N > 0): clip out the circle at the shared waypoint.
                // The previous segment's lineCap="round" end-cap already covers that
                // circle exactly. Removing it from this segment's stroke prevents
                // the two round caps from stacking and creating a double-opacity spot.
                // The evenodd fill rule turns the full-canvas rect + CW circle into
                // "draw everywhere EXCEPT inside the circle".
                // Konva's internal clip() call after clipFunc uses the same path with
                // the nonzero rule, which evaluates to the full canvas, so it adds no
                // further restriction.
                const wpX = line.points[0]!;
                const wpY = line.points[1]!;
                const clipR = effectiveBrushWidth / 2;
                return (
                    <Group
                        key={i}
                        clipFunc={(ctx) => {
                            ctx.beginPath();
                            ctx.rect(-1e7, -1e7, 2e7, 2e7);
                            ctx.arc(wpX, wpY, clipR, 0, Math.PI * 2);
                            ctx.clip("evenodd");
                        }}
                    >
                        {lineEl}
                    </Group>
                );
            })}

            {/* ── Active (in-progress) line ── */}
            {activeLinePoints.length >= 4 && (() => {
                const activeEl = (
                    <Line
                        points={activeLinePoints}
                        stroke={brushColor}
                        strokeWidth={effectiveBrushWidth}
                        lineCap="round"
                        lineJoin="round"
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                );
                if (committedLines.length === 0) return activeEl;
                // Clip the active line's start the same way: the last committed
                // segment's end-cap already covers the waypoint.
                const wpX = activeLinePoints[0]!;
                const wpY = activeLinePoints[1]!;
                const clipR = effectiveBrushWidth / 2;
                return (
                    <Group
                        clipFunc={(ctx) => {
                            ctx.beginPath();
                            ctx.rect(-1e7, -1e7, 2e7, 2e7);
                            ctx.arc(wpX, wpY, clipR, 0, Math.PI * 2);
                            ctx.clip("evenodd");
                        }}
                    >
                        {activeEl}
                    </Group>
                );
            })()}

            {/* ── Start marker ── */}
            {startMarkerShow && startX !== null && startY !== null && (
                <Circle
                    x={startX}
                    y={startY}
                    radius={startMarkerSize}
                    fill={startMarkerFill}
                    stroke={startMarkerBorder}
                    strokeWidth={startMarkerSize * 0.2}
                    listening={false}
                    perfectDrawEnabled={false}
                />
            )}

            {/* ── End marker — only after animation completes ── */}
            {showEndMarker && (
                <Circle
                    x={endX!}
                    y={endY!}
                    radius={endMarkerSize}
                    fill={endMarkerFill}
                    stroke={endMarkerBorder}
                    strokeWidth={endMarkerSize * 0.2}
                    listening={false}
                    perfectDrawEnabled={false}
                />
            )}
        </Layer>
    );
}

export const CanvasCoverageReplayLayer = memo(_CanvasCoverageReplayLayer);

