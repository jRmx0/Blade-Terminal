import UiInspectorPanel from "@/features/ui-manager/components/side-panels/UiInspectorPanel";
import InspectorPanelSection from "@/components/inspector-panel/InspectorPanelSection";
import InspectorPanelTabBar from "@/components/inspector-panel/InspectorPanelTabBar";
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
import LayersTab from "@/features/inspector/components/calc-layers-section/LayersTab";
import PointTypeField from "@/features/inspector/components/point-section/PointTypeField";
import PointPositionField from "@/features/inspector/components/point-section/PointPositionField";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { useInspectorTabStore } from "@/features/inspector/stores/inspectorTabStore";
import type { InspectorTab } from "@/features/inspector/stores/inspectorTabStore";

const INSPECTOR_TABS: { id: InspectorTab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "layers", label: "Layers" },
];

export default function InspectorPanel() {
  const hasSelection = useCanvasSelectionStore((s) => s.selectedObject !== null);
  const hasPointSelection = useCanvasSelectionStore((s) => s.selectedEnvPointType !== null);
  const activeTab = useInspectorTabStore((s) => s.activeTab);
  const setActiveTab = useInspectorTabStore((s) => s.setActiveTab);

  return (
    <UiInspectorPanel>
      <InspectorPanelTabBar
        tabs={INSPECTOR_TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as InspectorTab)}
      />

      {activeTab === "details" && (
        <div>
          {!hasSelection && !hasPointSelection && (
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

          {hasPointSelection && (
            <InspectorPanelSection title="Point">
              <PointTypeField />
              <PointPositionField />
            </InspectorPanelSection>
          )}

          <InspectorPanelSection title="Coverage">
            <CoverageField />
            <OverlapField />
            <TurnSumField />
          </InspectorPanelSection>
        </div>
      )}

      {activeTab === "layers" && <LayersTab />}
    </UiInspectorPanel>
  );
}

