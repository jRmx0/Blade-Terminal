import { useEffect, useRef } from "react";
import { useComputeResultStore } from "@/stores/useComputeResultStore";
import {
    flattenCoveragePathPlan,
    slicePathAtDistance,
    type FlattenedPath,
} from "@/features/coverage-replay/utils/coveragePathFlattener";
import { useCoverageReplayStore } from "@/features/coverage-replay/stores/useCoverageReplayStore";

/**
 * RAF-based animation hook for the coverage path replay.
 *
 * - Reads `isPlaying`, `playbackSpeed`, `currentDistance`, and `advancePath`
 *   from `useCoverageReplayStore`.
 * - Derives the `FlattenedPath` once from the current compute result and caches
 *   it in a ref. The flattened path is re-derived whenever `isPlaying` turns
 *   true so a new replay always starts fresh.
 * - Each animation frame advances `currentDistance` by `dt * playbackSpeed`,
 *   slices the path at that distance, and calls `advancePath()`.
 * - Automatically pauses when `currentDistance >= totalLength`.
 */
export function useCoverageReplayAnimation() {
    const rafRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);
    const flatPathRef = useRef<FlattenedPath | null>(null);

    const isPlaying = useCoverageReplayStore((s) => s.isPlaying);

    useEffect(() => {
        if (!isPlaying) {
            // Cancel any running RAF when paused/stopped
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            lastTimestampRef.current = null;
            return;
        }

        // Build/rebuild the flattened path from the current compute result
        const plan =
            useComputeResultStore.getState().result?.result.coveragePathPlan;
        if (!plan) {
            useCoverageReplayStore.getState().pauseReplay();
            return;
        }
        flatPathRef.current = flattenCoveragePathPlan(plan);

        const flat = flatPathRef.current;
        if (flat.totalLength === 0) {
            useCoverageReplayStore.getState().pauseReplay();
            return;
        }

        function tick(timestamp: number) {
            const store = useCoverageReplayStore.getState();

            if (!store.isPlaying) {
                // Pause/stop was called between RAF frames
                lastTimestampRef.current = null;
                return;
            }

            const currentFlat = flatPathRef.current!;

            // Compute delta time in seconds
            const dt =
                lastTimestampRef.current !== null
                    ? (timestamp - lastTimestampRef.current) / 1000
                    : 0;
            lastTimestampRef.current = timestamp;

            const newDistance = store.currentDistance + dt * store.playbackSpeed;

            const slice = slicePathAtDistance(currentFlat, newDistance);

            if (newDistance >= currentFlat.totalLength) {
                // Path fully drawn — finalize and stop playing
                const finalSlice = slicePathAtDistance(
                    currentFlat,
                    currentFlat.totalLength,
                );
                store.advancePath(
                    finalSlice.committedLines,
                    finalSlice.activeLinePoints,
                    currentFlat.totalLength,
                );
                store.pauseReplay();
                rafRef.current = null;
                lastTimestampRef.current = null;
                return;
            }

            store.advancePath(slice.committedLines, slice.activeLinePoints, newDistance);
            rafRef.current = requestAnimationFrame(tick);
        }

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [isPlaying]);
}
