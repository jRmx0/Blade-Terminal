import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useEnvStore } from "@/stores/envStore";
import { useSaveModeStore } from "@/stores/saveModeStore";
import { WORKBENCH_SHORTCUTS as S } from "@/config/shortcut-manager/workbenchShortcutsConfig";

export default function WorkspaceSaveButton() {
  const save = useEnvStore((state) => state.save);
  const { mode, setMode } = useSaveModeStore();

  const handleClick = () => {
    save()
      .then(() => {
        if (mode === "session") setMode("manual");
      })
      .catch(console.error);
  };

  return (
    <MenuBarItem label="Save" shortcut={S["workspace.save"].shortcut} onClick={handleClick} />
  );
}
