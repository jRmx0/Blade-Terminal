import UiInspectorPanel from "@/features/ui-manager/components/side-panels/UiInspectorPanel";
import InspectorPanelSection from "@/components/inspector-panel/InspectorPanelSection";
import ZoneSumField from "@/features/inspector/components/env-section/ZoneSumField";
import ObstacleSumField from "@/features/inspector/components/env-section/ObstacleSumField";
import CategoryField from "@/features/inspector/components/object-section/CategoryField";
import TypeField from "@/features/inspector/components/object-section/TypeField";
import VertexSumField from "@/features/inspector/components/object-section/VertexSumField";
import GrossAreaField from "@/features/inspector/components/object-section/GrossAreaField";
import NetAreaField from "@/features/inspector/components/object-section/NetAreaField";
import CoverageField from "@/features/inspector/components/coverage-section/CoverageField";
import OverlapField from "@/features/inspector/components/coverage-section/OverlapField";
import TurnSumField from "@/features/inspector/components/coverage-section/TurnSumField";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";

export default function InspectorPanel() {
  const hasSelection = useCanvasSelectionStore((s) => s.selectedObjectId !== null);

  return (
    <UiInspectorPanel>
      <div>
        {!hasSelection && (
          <InspectorPanelSection title="Environment">
            <ZoneSumField />
            <ObstacleSumField />
          </InspectorPanelSection>
        )}

        {hasSelection && (
          <InspectorPanelSection title="Object">
            <CategoryField />
            <TypeField />
            <VertexSumField />
            <GrossAreaField />
            <NetAreaField />
          </InspectorPanelSection>
        )}

        <InspectorPanelSection title="Coverage">
          <CoverageField />
          <OverlapField />
          <TurnSumField />
        </InspectorPanelSection>
      </div>
    </UiInspectorPanel>
  );
}

