import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useEnvStore } from "@/stores/envStore";
import { useSaveModeStore } from "@/stores/saveModeStore";

export default function WorkspaceSaveButton() {
  const save = useEnvStore((state) => state.save);
  const { mode, setMode, markSaved } = useSaveModeStore();

  const handleClick = () => {
    save()
      .then(() => {
        if (mode === "session") setMode("manual");
        markSaved();
      })
      .catch(console.error);
  };

  return (
    <MenuBarItem label="Save" shortcut={["Ctrl", "S"]} onClick={handleClick} />
  );
}
