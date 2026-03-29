import UiStatusBar from "@/features/ui-manager/components/status-bar/UiStatusBar";
import SaveStateButton from "@/features/workspace-manager/components/status-bar/SaveStateButton";
import CanvasPointerPosition from "@/features/canvas-editing/components/status-bar/CanvasPointerPosition";
import CanvasGridScale from "@/features/canvas-editing/components/status-bar/CanvasGridScale";

export default function StatusBar() {
  return (
    <UiStatusBar
      leftChildren={<SaveStateButton />}
      rightChildren={
        <>
          <CanvasGridScale />
          <div className="w-px h-3 bg-gray-300" />
          <CanvasPointerPosition />
        </>
      }
    />
  );
}
