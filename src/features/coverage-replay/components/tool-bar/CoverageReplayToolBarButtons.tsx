import { useState } from "react";
import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import ModalPopUp from "@/components/modal/modal-pop-up/ModalPopUp";
import { useCoverageReplayStore } from "@/features/coverage-replay/stores/useCoverageReplayStore";
import { useComputeResultStore } from "@/stores/useComputeResultStore";

// ─── Speed popup ──────────────────────────────────────────────────────────────

const MIN_SPEED = 0.1;
const MAX_SPEED_SLIDER = 50;

function CoverageReplaySpeedPopUp() {
    const playbackSpeed = useCoverageReplayStore((s) => s.playbackSpeed);
    const setPlaybackSpeed = useCoverageReplayStore((s) => s.setPlaybackSpeed);

    // Local draft — synced to store on blur / on slider move
    const [draft, setDraft] = useState<string>(String(playbackSpeed));

    function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = parseFloat(e.target.value);
        setPlaybackSpeed(val);
        setDraft(String(val));
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        setDraft(e.target.value);
    }

    function handleInputBlur() {
        const val = parseFloat(draft);
        if (!isNaN(val) && val >= MIN_SPEED) {
            setPlaybackSpeed(val);
            setDraft(String(val));
        } else {
            setDraft(String(playbackSpeed));
        }
    }

    return (
        <div className="p-3 flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Replay Speed
            </span>
            <div className="flex items-center gap-2">
                <input
                    type="range"
                    min={MIN_SPEED}
                    max={MAX_SPEED_SLIDER}
                    step={0.1}
                    value={Math.min(playbackSpeed, MAX_SPEED_SLIDER)}
                    onChange={handleSliderChange}
                    className="flex-1 accent-teal-600"
                />
                <input
                    type="number"
                    min={MIN_SPEED}
                    step={0.1}
                    value={draft}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className="w-16 text-xs border border-gray-300 rounded px-1 py-0.5 text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <span className="text-xs text-gray-500">m/s</span>
            </div>
        </div>
    );
}

// ─── Toolbar button group ─────────────────────────────────────────────────────

export default function CoverageReplayToolBarButtons() {
    const isReplayMode = useCoverageReplayStore((s) => s.isReplayMode);
    const isPlaying = useCoverageReplayStore((s) => s.isPlaying);
    const stopReplay = useCoverageReplayStore((s) => s.stopReplay);
    const pauseReplay = useCoverageReplayStore((s) => s.pauseReplay);
    const resumeReplay = useCoverageReplayStore((s) => s.resumeReplay);
    const startReplay = useCoverageReplayStore((s) => s.startReplay);

    const hasResult = useComputeResultStore(
        (s) => s.result?.result.coveragePathPlan != null,
    );

    function handlePlayPauseClick() {
        if (!isReplayMode) {
            // Start fresh replay
            startReplay();
        } else if (isPlaying) {
            pauseReplay();
        } else {
            resumeReplay();
        }
    }

    const playIcon = isReplayMode && isPlaying ? "pause" : "play_arrow";
    const playTitle = isReplayMode && isPlaying
        ? "Pause replay"
        : isReplayMode
            ? "Resume replay"
            : "Play coverage path replay";

    return (
        <>
            {/* Stop */}
            <ToolBarButton
                title="Stop replay"
                icon="stop"
                isDisabled={!isReplayMode}
                onClick={stopReplay}
            />

            {/* Play / Pause */}
            <ToolBarButton
                title={playTitle}
                icon={playIcon}
                isActive={isReplayMode && isPlaying}
                isDisabled={!hasResult}
                onClick={handlePlayPauseClick}
            />

            {/* Speed — ModalPopUp trigger */}
            <ModalPopUp
                openOnHover={false}
                openOnClick={true}
                widthClassName="w-56"
                trigger={
                    <ToolBarButton
                        title="Playback speed"
                        icon="speed"
                        isDisabled={false}
                    />
                }
            >
                <CoverageReplaySpeedPopUp />
            </ModalPopUp>
        </>
    );
}
