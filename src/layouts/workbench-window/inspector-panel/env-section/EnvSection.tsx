import InspectorPanelSection from "@/components/inspector-panel/InspectorPanelSection";
import ObstacleSumField from "@/features/inspector/components/env-section/ObstacleSumField";
import ZoneSumField from "@/features/inspector/components/env-section/ZoneSumField";

export default function EnvSection() {
  return (
    <InspectorPanelSection title="Environment">
      <ZoneSumField />
      <ObstacleSumField />
    </InspectorPanelSection>
  );
}
