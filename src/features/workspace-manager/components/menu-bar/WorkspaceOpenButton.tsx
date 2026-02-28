import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useWorkspacePickerStore } from "@/features/workspace-manager/stores/workspacePickerStore";

export default function WorkspaceOpenButton() {
  const open = useWorkspacePickerStore((s) => s.open);

  return (
    <MenuBarItem
      label="Open..."
      shortcut={["Ctrl", "O"]}
      onClick={open}
    />
  );
}
