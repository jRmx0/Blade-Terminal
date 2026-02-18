import UiControlsButton from "@/features/ui-manager/components/tool-bar/UiControlsButton/UiControlsButton";
import AddZoneButton from "@/features/canvas-editing/components/tool-bar/AddZoneButton/AddZoneButton";
import AddObstacleButton from "@/features/canvas-editing/components/tool-bar/AddObstacleButton/AddObstacleButton";
import DeleteButton from "@/features/canvas-editing/components/tool-bar/DeleteButton/DeleteButton";
import ExecuteCppButton from "@/features/coverage-planning/components/tool-bar/ExecuteCppButton/ExecuteCppButton";
import ClearCppButton from "@/features/coverage-planning/components/tool-bar/ClearCppButton/ClearCppButton";
import OpenJobListButton from "@/features/job-runner/components/tool-bar/OpenJobListButton/OpenJobListButton";
import UiInspectorButton from "@/features/ui-manager/components/tool-bar/UiInspectorButton/UiInspectorButton";
import ToolSeparator from "@/components/ToolBarSeparator/ToolBarSeparator";
import EditButton from "@/features/canvas-editing/components/tool-bar/EditButton/EditButton";

export default function ToolBar() {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1 bg-gray-100 border-b border-gray-300">
      <div className="flex items-center gap-2">
        <UiControlsButton />
        <ToolSeparator />

        <EditButton />
        <ToolSeparator />

        <AddZoneButton />
        <AddObstacleButton />

        <ToolSeparator />
        <DeleteButton />

        <ToolSeparator />
        <ExecuteCppButton />
        <ClearCppButton />

        <ToolSeparator />
        <OpenJobListButton />
      </div>
      <div className="flex items-center gap-2">
        <UiInspectorButton />
      </div>
    </div>
  );
}
