import ApplicationHeader from "./application-header/ApplicationHeader";
import ToolBar from "./tool-bar/ToolBar";
import ControlsPanel from "./controls-panel/ControlsPanel";
import InspectorPanel from "./inspector-panel/InspectorPanel";
import StatusBar from "./status-bar/StatusBar";
import CanvasEditorLayout from "./canvas-editor/CanvasEditorLayout";
import { useWorkbenchShortcuts } from "@/hooks/shortcut-manager/useWorkbenchShortcuts";
import WorkspacePickerModal from "@/features/workspace-manager/components/workspace-picker-modal/WorkspacePickerModal";
import SaveModal from "@/features/workspace-manager/components/save-modal/SaveModal";
import SaveAsModal from "@/features/workspace-manager/components/save-as-modal/SaveAsModal";
import DeleteModal from "@/features/workspace-manager/components/delete-modal/DeleteModal";

export default function WorkbenchWindow() {
  useWorkbenchShortcuts();

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
      <WorkspacePickerModal />
      <SaveModal />
      <SaveAsModal />
      <DeleteModal />
    </div>
  );
}
