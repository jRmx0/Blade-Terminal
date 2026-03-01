import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useSaveModeStore } from "@/stores/saveModeStore";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";
import { performSave } from "@/features/canvas-editing/hooks/canvas-editor/useCanvasSave";

export default function WorkspaceSaveButton() {
  const { mode, setMode } = useSaveModeStore();

  const handleClick = () => {
    performSave()
      .then(() => {
        if (mode === "session") setMode("manual");
      })
      .catch(console.error);
  };

  return (
    <MenuBarItem label="Save" shortcut={S["workspace.save"].shortcut} onClick={handleClick} />
  );
}
