import CanvasEditor from "@/features/canvas-editing/components/canvas-editor/CanvasEditor";

export default function CanvasEditorLayout() {
  return (
    <div className="flex-1 min-w-0 h-full overflow-hidden">
      <CanvasEditor />
    </div>
  );
}
