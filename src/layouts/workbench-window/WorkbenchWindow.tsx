import ApplicationHeader from "./application-header/ApplicationHeader";
import ToolBar from "./tool-bar/ToolBar";
import ControlsPanel from "./controls-panel/ControlsPanel";
import InspectorPanel from "./inspector-panel/InspectorPanel";
import StatusBar from "./status-bar/StatusBar";
import CanvasEditorLayout from "./canvas-editor/CanvasEditorLayout";

export default function WorkbenchWindow() {
  return (
    <div className="flex flex-col w-full h-full">
      <ApplicationHeader />
      <ToolBar />
      <div className="flex flex-1 overflow-hidden">
        <ControlsPanel />
        <CanvasEditorLayout />
        <InspectorPanel />
      </div>
      <StatusBar />
    </div>
  );
}
