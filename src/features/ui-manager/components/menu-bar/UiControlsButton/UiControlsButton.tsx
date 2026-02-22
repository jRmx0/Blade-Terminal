import MenuBarItem from "@/components/MenuBarItem/MenuBarItem";
import { useUiControlsPanelStore } from "@/features/ui-manager/stores/uiControlsPanelStore";

export default function UiControlsButton() {
  const isVisible = useUiControlsPanelStore((state) => state.isVisible);
  const setVisibility = useUiControlsPanelStore((state) => state.setVisibility);

  return (
    <MenuBarItem
      label="Controls"
      shortcut={["Ctrl", "Alt", "C"]}
      hasCheckmark
      defaultChecked={isVisible}
      onClick={() => setVisibility(!isVisible)}
    />
  );
}
