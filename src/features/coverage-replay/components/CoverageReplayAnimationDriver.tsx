import { useCoverageReplayAnimation } from "@/features/coverage-replay/hooks/useCoverageReplayAnimation";

/**
 * Mounts the RAF animation loop for coverage path replay.
 * Renders nothing — exists purely to host the animation hook.
 * Place this component anywhere in the React tree that is always mounted
 * (e.g., inside WorkbenchWindow).
 */
export default function CoverageReplayAnimationDriver() {
    useCoverageReplayAnimation();
    return null;
}
