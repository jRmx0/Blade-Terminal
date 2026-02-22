import WorkbenchWindow from "@/layouts/workbench-window/WorkbenchWindow";
import ShortcutManager from "@/components/ShortcutManager/ShortcutManager";

export function App() {
  return (
    <>
      <ShortcutManager />
      <WorkbenchWindow />
    </>
  );
}

export default App;
