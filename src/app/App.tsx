import { useEffect } from "react";
import WorkbenchWindow from "@/layouts/workbench-window/WorkbenchWindow";
import ShortcutManager from "@/components/shortcut-manager/ShortcutManager";
import { initializeWorkspace } from "@/features/workspace-manager/data/workspaceBridge";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";

export function App() {
  useBeforeUnload();

  useEffect(() => {
    initializeWorkspace().catch(console.error);
  }, []);

  return (
    <>
      <ShortcutManager />
      <WorkbenchWindow />
    </>
  );
}

export default App;
