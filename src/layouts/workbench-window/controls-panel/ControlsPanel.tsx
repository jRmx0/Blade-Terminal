import UiControlsPanel from "@/features/ui-manager/components/side-panels/UiControlsPanel/UiControlsPanel";
import AlgoSection from "../../../features/coverage-planning/components/controls-panel/AlgoSection/AlgoSection";
import EnvSection from "@/features/coverage-planning/components/controls-panel/EnvSection/EnvSection";
import ObjectSection from "@/features/coverage-planning/components/controls-panel/ObjectSection/ObjectSection";

export default function ControlsPanel() {
  return (
    <UiControlsPanel>
      <div className="flex flex-col gap-2 p-1">
        <AlgoSection />
        <EnvSection />
        <ObjectSection />
      </div>
    </UiControlsPanel>
  );
}
