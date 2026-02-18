import UiControlsPanel from "@/features/ui-manager/components/side-panels/UiControlsPanel/UiControlsPanel";
import AlgoSectionTitle from "./algo-section/AlgoSectionTitle";
import AlgoSectionSubmenu from "./algo-section/AlgoSectionSubmenu";

export default function ControlsPanel() {
  return (
    <UiControlsPanel>
      <div className="flex flex-col gap-2 p-3">
        <AlgoSectionTitle />
        <AlgoSectionSubmenu />
      </div>
    </UiControlsPanel>
  );
}
