import InspectorPanelSection from "@/components/inspector-panel/InspectorPanelSection";
import TypeField from "@/features/inspector/components/object-section/TypeField/TypeField";
import CategoryField from "@/features/inspector/components/object-section/CategoryField/CategoryField";
import GrossAreaField from "@/features/inspector/components/object-section/GrossAreaField/GrossAreaField";
import NetAreaField from "@/features/inspector/components/object-section/NetAreaField/NetAreaField";
import VertexSumField from "@/features/inspector/components/object-section/VertexSumField/VertexSumField";

export default function ObjectSection() {
  return (
    <InspectorPanelSection title="Object">
      <CategoryField />
      <TypeField />
      <VertexSumField />
      <GrossAreaField />
      <NetAreaField />
    </InspectorPanelSection>
  );
}
