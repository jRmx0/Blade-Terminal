import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { useCppDebugStore } from "@/features/coverage-planning/stores/cppDebugStore";

export default function DebugCppButton() {
    const isDebugMode = useCppDebugStore((s) => s.isDebugMode);
    const startDebug = useCppDebugStore((s) => s.startDebug);

    function handleClick() {
        if (!isDebugMode) {
            startDebug();
        }
    }

    return (
        <ToolBarButton
            title="Debug coverage path planning"
            icon="bug_report"
            isActive={isDebugMode}
            onClick={handleClick}
        />
    );
}
