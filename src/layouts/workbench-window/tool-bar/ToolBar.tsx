import UiControlsButton from "@/features/ui-manager/components/tool-bar/UiControlsButton";
import AddZoneButton from "@/features/canvas-editing/components/tool-bar/AddZoneButton";
import AddObstacleButton from "@/features/canvas-editing/components/tool-bar/AddObstacleButton";
import DeleteButton from "@/features/canvas-editing/components/tool-bar/DeleteButton";
import ExecuteCppButton from "@/features/coverage-planning/components/tool-bar/ExecuteCppButton";
import ClearCppButton from "@/features/coverage-planning/components/tool-bar/ClearCppButton";
import OpenJobListButton from "@/features/job-runner/components/tool-bar/OpenJobListButton";
import UiInspectorButton from "@/features/ui-manager/components/tool-bar/UiInspectorButton";
import ToolSeparator from "@/components/tool-bar/ToolBarSeparator";
import EditButton from "@/features/canvas-editing/components/tool-bar/EditButton";

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
