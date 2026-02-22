import UiInspectorPanel from "@/features/ui-manager/components/side-panels/UiInspectorPanel/UiInspectorPanel";
import CoverageSection from "./coverage-section/CoverageSection";
import EnvSection from "./env-section/EnvSection";
import ObjectSection from "./object-section/ObjectSection";

export default function InspectorPanel() {
  return (
    <UiInspectorPanel>
      <div>
        <EnvSection />
        <ObjectSection />
        <CoverageSection />
      </div>
    </UiInspectorPanel>
  );
}
