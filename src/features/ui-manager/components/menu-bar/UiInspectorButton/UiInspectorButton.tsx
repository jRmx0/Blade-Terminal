import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useUiInspectorPanelStore } from "@/features/ui-manager/stores/uiInspectorPanelStore";

export default function UiInspectorButton() {
  const isVisible = useUiInspectorPanelStore((state) => state.isVisible);
  const setVisibility = useUiInspectorPanelStore(
    (state) => state.setVisibility,
  );

  return (
    <MenuBarItem
      label="Inspector"
      shortcut={["Ctrl", "Alt", "I"]}
      hasCheckmark
      defaultChecked={isVisible}
      onClick={() => setVisibility(!isVisible)}
    />
  );
}
