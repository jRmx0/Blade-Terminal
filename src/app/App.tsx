import { useEffect } from "react";
import WorkbenchWindow from "@/layouts/workbench-window/WorkbenchWindow";
import ShortcutManager from "@/components/shortcut-manager/ShortcutManager";
import { useEnvStore } from "@/stores/envStore";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";

export function App() {
  const init = useEnvStore((state) => state.init);

  useBeforeUnload();

  useEffect(() => {
    init();
  }, []);

  return (
    <>
      <ShortcutManager />
      <WorkbenchWindow />
    </>
  );
}

export default App;
