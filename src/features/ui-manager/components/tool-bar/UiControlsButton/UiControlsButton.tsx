import ToggleToolBarButton from "@/components/tool-bar/ToolBarToggleButton";
import { useUiControlsPanelStore } from "@/features/ui-manager/stores/uiControlsPanelStore";
import { useShortcut } from "@/hooks/shortcut-manager/useShortcut";

export default function UiControlsButton() {
  const isVisible = useUiControlsPanelStore((state) => state.isVisible);
  const setVisibility = useUiControlsPanelStore((state) => state.setVisibility);

  useShortcut("controls.toggle", "Ctrl+Alt+C", () =>
    setVisibility(!useUiControlsPanelStore.getState().isVisible),
  );

  return (
    <ToggleToolBarButton
      titleOff="Expand controls panel"
      titleOn="Collapse controls panel"
      iconOff="left_panel_open"
      iconOn="left_panel_close"
      isToggled={isVisible}
      onChange={setVisibility}
    />
  );
}
