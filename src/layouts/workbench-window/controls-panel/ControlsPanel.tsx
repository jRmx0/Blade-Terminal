import UiControlsPanel from "@/features/ui-manager/components/side-panels/UiControlsPanel";
import AlgoSection from "./algo-section/AlgoSection";
import EnvSection from "@/layouts/workbench-window/controls-panel/env-section/EnvSection";
import ObjectSection from "@/layouts/workbench-window/controls-panel/object-section/ObjectSection";

export default function ControlsPanel() {
  return (
    <UiControlsPanel>
      <div>
        <AlgoSection />
        <EnvSection />
        <ObjectSection />
      </div>
    </UiControlsPanel>
  );
}
