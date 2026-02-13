import CanvasResetViewButton from "@/features/canvas-editing/components/menu-bar/CanvasResetViewButton/CanvasResetViewButton";
import CanvasZoomInButton from "@/features/canvas-editing/components/menu-bar/CanvasZoomInButton/CanvasZoomInButton";
import CanvasZoomOutButton from "@/features/canvas-editing/components/menu-bar/CanvasZoomOutButton/CanvasZoomOutButton";
import CanvasToggleGridButton from "@/features/canvas-editing/components/menu-bar/CanvasToggleGridButton/CanvasToggleGridButton";
import MenuSeparator from "@/components/MenuSeparator/MenuSeparator";
import UiInspectorButton from "@/features/ui-manager/components/menu-bar/UiInspectorButton/UiInspectorButton";
import UiControlsButton from "@/features/ui-manager/components/menu-bar/UiControlsButton/UiControlsButton";
import UiStatusBarButton from "@/features/ui-manager/components/menu-bar/UiStatusBarButton/UiStatusBarButton";

export default function MenuBarViewSubmenu() {
  return (
    <div className="w-64 py-1 bg-gray-100">
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
