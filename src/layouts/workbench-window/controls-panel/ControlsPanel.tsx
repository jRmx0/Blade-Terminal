import UiControlsPanel from "@/features/ui-manager/components/side-panels/UiControlsPanel";
import ControlsPanelSection from "@/components/controls-panel/ControlsPanelSection";
import AlgoSelect from "@/features/coverage-planning/components/controls-panel/algo-section/AlgoSelect";
import PathWidthInput from "@/features/coverage-planning/components/controls-panel/algo-section/PathWidthInput";
import PathOverlapInput from "@/features/coverage-planning/components/controls-panel/algo-section/PathOverlapInput";
import GlobalTypeSelection from "@/features/coverage-planning/components/controls-panel/env-section/GlobalTypeSelect";
import FormatSelection from "@/features/coverage-planning/components/controls-panel/env-section/FormatSelect";
import ObjectTypeSelect from "@/features/coverage-planning/components/controls-panel/object-section/ObjectTypeSelect";

export default function ControlsPanel() {
  return (
    <UiControlsPanel>
      <div>
        <ControlsPanelSection sectionId="algo" title="Coverage Path">
          <AlgoSelect />
          <PathWidthInput />
          <PathOverlapInput />
        </ControlsPanelSection>

        <ControlsPanelSection sectionId="env" title="Environment">
          <GlobalTypeSelection />
          <FormatSelection />
        </ControlsPanelSection>

        <ControlsPanelSection sectionId="object" title="Object">
          <ObjectTypeSelect />
        </ControlsPanelSection>
      </div>
    </UiControlsPanel>
  );
}
