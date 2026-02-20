import UiControlsPanel from "@/features/ui-manager/components/side-panels/UiControlsPanel/UiControlsPanel";
import AlgoSection from "../../../features/coverage-planning/components/AlgoSection/AlgoSection";

export default function ControlsPanel() {
  return (
    <UiControlsPanel>
      <div className="flex flex-col gap-2 p-3">
        <AlgoSection />
      </div>
    </UiControlsPanel>
  );
}
