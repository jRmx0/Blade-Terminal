import InspectorPanelSection from "@/components/InspectorPanelSection/InspectorPanelSection";
import ObstacleSumField from "@/features/inspector/components/env-section/ObstacleSumField/ObstacleSumField";
import ZoneSumField from "@/features/inspector/components/env-section/ZoneSumField/ZoneSumField";

export default function EnvSection() {
  return (
    <InspectorPanelSection title="Environment">
      <ZoneSumField />
      <ObstacleSumField />
    </InspectorPanelSection>
  );
}
