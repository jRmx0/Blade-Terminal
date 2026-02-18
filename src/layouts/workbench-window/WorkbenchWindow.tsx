import ApplicationHeader from "./application-header/ApplicationHeader";
import ToolBar from "./tool-bar/ToolBar";
import ControlsPanel from "./controls-panel/ControlsPanel";

export default function WorkbenchWindow() {
  return (
    <div className="flex flex-col w-full h-full">
      <ApplicationHeader />
      <ToolBar />
      <div className="flex flex-1 overflow-hidden">
        <ControlsPanel />
      </div>
    </div>
  );
}
