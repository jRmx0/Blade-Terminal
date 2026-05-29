import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DrawnLine {
    /** Flat [x, y, x, y, …] coordinates for a Konva Line. */
    points: number[];
}

interface CoverageReplayState {
    // ── Playback state ────────────────────────────────────────────────────────
    isReplayMode: boolean;
    isPlaying: boolean;
    /** World units (meters) per second. */
    playbackSpeed: number;
    /** Accumulated world-unit distance traveled along the flattened path. */
    currentDistance: number;

    // ── Drawn path ────────────────────────────────────────────────────────────
    /** Finalized Konva Line data — one entry per completed segment group. */
    committedLines: DrawnLine[];
    /** In-progress current segment being animated. */
    activeLinePoints: number[];

    // ── Actions ───────────────────────────────────────────────────────────────
    startReplay: () => void;
    stopReplay: () => void;
    pauseReplay: () => void;
    resumeReplay: () => void;
    setPlaybackSpeed: (speed: number) => void;
    advancePath: (
        committedLines: DrawnLine[],
        activeLinePoints: number[],
        currentDistance: number,
    ) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCoverageReplayStore = create<CoverageReplayState>((set) => ({
    isReplayMode: false,
    isPlaying: false,
    playbackSpeed: 10,
    currentDistance: 0,
    committedLines: [],
    activeLinePoints: [],

    startReplay: () =>
        set({
            isReplayMode: true,
            isPlaying: true,
            currentDistance: 0,
            committedLines: [],
            activeLinePoints: [],
        }),

    stopReplay: () =>
        set({
            isReplayMode: false,
            isPlaying: false,
            currentDistance: 0,
            committedLines: [],
            activeLinePoints: [],
        }),

    pauseReplay: () => set({ isPlaying: false }),

    resumeReplay: () => set({ isPlaying: true }),

    setPlaybackSpeed: (speed) => set({ playbackSpeed: Math.max(0.01, speed) }),

    advancePath: (committedLines, activeLinePoints, currentDistance) =>
        set({ committedLines, activeLinePoints, currentDistance }),

}));
