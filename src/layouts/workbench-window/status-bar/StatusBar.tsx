import UiStatusBar from "@/features/ui-manager/components/status-bar/UiStatusBar";
import SaveStateButton from "@/features/workspace-manager/components/status-bar/SaveStateButton";
import CanvasPointerPosition from "@/features/canvas-editing/components/status-bar/CanvasPointerPosition";

export default function StatusBar() {
  return (
    <UiStatusBar
      leftChildren={<SaveStateButton />}
      rightChildren={<CanvasPointerPosition />}
    />
  );
}
