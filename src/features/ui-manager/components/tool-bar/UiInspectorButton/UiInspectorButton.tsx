import ToggleToolBarButton from "@/components/tool-bar/ToolBarToggleButton";
import { useUiInspectorPanelStore } from "@/features/ui-manager/stores/uiInspectorPanelStore";
import { useShortcut } from "@/hooks/shortcut-manager/useShortcut";

export default function UiInspectorButton() {
  const isVisible = useUiInspectorPanelStore((state) => state.isVisible);
  const setVisibility = useUiInspectorPanelStore(
    (state) => state.setVisibility,
  );

  useShortcut("inspector.toggle", "Ctrl+Alt+I", () =>
    setVisibility(!useUiInspectorPanelStore.getState().isVisible),
  );

  return (
    <ToggleToolBarButton
      titleOff="Expand inspector panel"
      titleOn="Collapse inspector panel"
      iconOff="right_panel_open"
      iconOn="right_panel_close"
      isToggled={isVisible}
      onChange={setVisibility}
    />
  );
}
