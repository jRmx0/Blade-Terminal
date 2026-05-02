import { useEffect } from "react";
import WorkbenchWindow from "@/layouts/workbench-window/WorkbenchWindow";
import ShortcutManager from "@/components/shortcut-manager/ShortcutManager";
import { initializeWorkspace } from "@/features/workspace-manager/data/workspaceBridge";
import { startCoverageCacheSync } from "@/features/coverage-planning/data/coverageCacheService";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";

export function App() {
  useBeforeUnload();

  useEffect(() => {
    const stopCoverageSync = startCoverageCacheSync();
    initializeWorkspace().catch(console.error);
    return () => {
      stopCoverageSync();
    };
  }, []);

  return (
    <>
      <ShortcutManager />
      <WorkbenchWindow />
    </>
  );
}

export default App;
