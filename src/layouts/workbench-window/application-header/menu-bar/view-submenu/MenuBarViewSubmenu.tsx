import CanvasResetViewButton from "@/features/canvas-editing/components/menu-bar/CanvasResetViewButton";
import CanvasZoomInButton from "@/features/canvas-editing/components/menu-bar/CanvasZoomInButton";
import CanvasZoomOutButton from "@/features/canvas-editing/components/menu-bar/CanvasZoomOutButton";
import CanvasToggleGridButton from "@/features/canvas-editing/components/menu-bar/CanvasToggleGridButton";
import MenuSeparator from "@/components/menu-bar/MenuBarSeparator";
import UiInspectorButton from "@/features/ui-manager/components/menu-bar/UiInspectorButton";
import UiControlsButton from "@/features/ui-manager/components/menu-bar/UiControlsButton";
import UiStatusBarButton from "@/features/ui-manager/components/menu-bar/UiStatusBarButton";

export default function MenuBarViewSubmenu() {
  return (
    <div className="w-80 py-1 bg-gray-100">
      <CanvasResetViewButton />

      <MenuSeparator />

      <CanvasZoomInButton />
      <CanvasZoomOutButton />

      <MenuSeparator />

      <CanvasToggleGridButton />

      <MenuSeparator />

      <UiInspectorButton />
      <UiControlsButton />
      <UiStatusBarButton />
    </div>
  );
}
