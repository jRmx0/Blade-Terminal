import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useSaveModalStore } from "@/features/workspace-manager/stores/saveModalStore";
import { useEnvStore } from "@/stores/envStore";

export default function WorkspaceNewButton() {
  function handleClick() {
    useSaveModalStore.getState().requestWithSaveGuard(() => useEnvStore.getState().reset());
  }

  return (
    <MenuBarItem
      label="New..."
      shortcut={["Ctrl", "N"]}
      onClick={handleClick}
    />
  );
}
