import { type ReactNode } from "react";
import UiControlsButton from "@/features/ui-manager/components/tool-bar/UiControlsButton";
import AddZoneButton from "@/features/canvas-editing/components/tool-bar/AddZoneButton";
import AddObstacleButton from "@/features/canvas-editing/components/tool-bar/AddObstacleButton";
import AddStartPointButton from "@/features/canvas-editing/components/tool-bar/AddStartPointButton";
import AddEndPointButton from "@/features/canvas-editing/components/tool-bar/AddEndPointButton";
import DeleteButton from "@/features/canvas-editing/components/tool-bar/DeleteButton";
import ExecuteCppButton from "@/features/coverage-planning/components/tool-bar/ExecuteCppButton";
import ClearCppButton from "@/features/coverage-planning/components/tool-bar/ClearCppButton";
import OpenJobListButton from "@/features/job-runner/components/tool-bar/OpenJobListButton";
import UiInspectorButton from "@/features/ui-manager/components/tool-bar/UiInspectorButton";
import ToolSeparator from "@/components/tool-bar/ToolBarSeparator";
import SelectButton from "@/features/canvas-editing/components/tool-bar/SelectButton";
import UndoButton from "@/features/canvas-editing/components/tool-bar/UndoButton";
import RedoButton from "@/features/canvas-editing/components/tool-bar/RedoButton";
import ToolGroupSeparator from "@/components/tool-bar/ToolBarGroupSeparator";
import ToolBarMoreButton, { type OverflowItem } from "@/components/tool-bar/ToolBarMoreButton";
import { useToolBarOverflow } from "./useToolBarOverflow";
import { useUiControlsPanelStore } from "@/features/ui-manager/stores/uiControlsPanelStore";
import { useCanvasHistoryStore } from "@/features/canvas-editing/stores/canvasHistoryStore";
import { useCanvasToolStore } from "@/features/canvas-editing/stores/canvasToolStore";
import { useCanvasDrawingStore } from "@/features/canvas-editing/stores/canvasDrawingStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { useCanvasSelectionStore } from "@/features/canvas-editing/stores/canvasSelectionStore";
import { useComputeResultStore } from "@/stores/useComputeResultStore";
import { executeComputeRequest } from "@/features/coverage-planning/data/computeService";

interface ToolBarGroup {
  id: string;
  buttonCount: number;
  buttons: ReactNode;
  trailingSeparator?: "thin" | "thick";
  overflowItems: OverflowItem[];
}

export default function ToolBar() {
  // ui-controls
  const isControlsVisible = useUiControlsPanelStore((s) => s.isVisible);
  const setControlsVisibility = useUiControlsPanelStore((s) => s.setVisibility);

  // history
  const undo = useCanvasHistoryStore((s) => s.undo);
  const canUndo = useCanvasHistoryStore((s) => s.canUndo);
  const redo = useCanvasHistoryStore((s) => s.redo);
  const canRedo = useCanvasHistoryStore((s) => s.canRedo);

  // canvas tools
  const { activeTool, setActiveTool } = useCanvasToolStore();
  const cancelDrawing = useCanvasDrawingStore((s) => s.cancelDrawing);

  // delete
  const { deleteObject, deleteVertices } = useCanvasObjectStore();
  const { selectedObject, selectedVertexRefs, clearSelection, selectVertex } =
    useCanvasSelectionStore();

  // coverage
  const computeStatus = useComputeResultStore((s) => s.status);
  const isBusy = computeStatus === "submitting" || computeStatus === "polling";

  // derived
  const isSelectActive = activeTool === "select";
  const isAddZoneActive = activeTool === "addZone";
  const isAddObstacleActive = activeTool === "addObstacle";
  const isAddStartPointActive = activeTool === "addStartPoint";
  const isAddEndPointActive = activeTool === "addEndPoint";
  const isDeleteActive = activeTool === "delete";
  const hasSelection = selectedObject !== null;
  const hasVertexSelection = selectedVertexRefs.length > 0;

  function handleSelect() {
    cancelDrawing();
    if (isSelectActive) clearSelection();
    setActiveTool(isSelectActive ? null : "select");
  }

  function handleAddZone() {
    cancelDrawing();
    setActiveTool(isAddZoneActive ? null : "addZone");
  }

  function handleAddObstacle() {
    cancelDrawing();
    setActiveTool(isAddObstacleActive ? null : "addObstacle");
  }

  function handleAddStartPoint() {
    cancelDrawing();
    setActiveTool(isAddStartPointActive ? null : "addStartPoint");
  }

  function handleAddEndPoint() {
    cancelDrawing();
    setActiveTool(isAddEndPointActive ? null : "addEndPoint");
  }

  function handleDelete() {
    if (isDeleteActive) {
      clearSelection();
      setActiveTool(null);
      return;
    }
    const isInSelectModeWithSelection = activeTool === "select" && hasSelection;
    if (isInSelectModeWithSelection) {
      if (hasVertexSelection) {
        deleteVertices(selectedObject!, selectedVertexRefs);
        selectVertex(null);
      } else {
        deleteObject(selectedObject!);
        clearSelection();
      }
      return;
    }
    cancelDrawing();
    setActiveTool("delete");
  }

  function handleExecuteCpp() {
    executeComputeRequest().then((result) => {
      if (!result.ok) console.error("[ExecuteCpp] error:", result.error);
    });
  }

  const groups: ToolBarGroup[] = [
    {
      id: "ui-controls",
      buttonCount: 1,
      buttons: <UiControlsButton />,
      trailingSeparator: "thick",
      overflowItems: [
        {
          id: "ui-controls",
          icon: isControlsVisible ? "left_panel_close" : "left_panel_open",
          label: isControlsVisible
            ? "Collapse controls panel"
            : "Expand controls panel",
          isActive: isControlsVisible,
          onClick: () => setControlsVisibility(!isControlsVisible),
        },
      ],
    },
    {
      id: "history",
      buttonCount: 2,
      buttons: (
        <>
          <UndoButton />
          <RedoButton />
        </>
      ),
      trailingSeparator: "thick",
      overflowItems: [
        {
          id: "undo",
          icon: "undo",
          label: "Undo",
          isDisabled: !canUndo,
          onClick: undo,
        },
        {
          id: "redo",
          icon: "redo",
          label: "Redo",
          isDisabled: !canRedo,
          onClick: redo,
        },
      ],
    },
    {
      id: "select",
      buttonCount: 1,
      buttons: <SelectButton />,
      trailingSeparator: "thin",
      overflowItems: [
        {
          id: "select",
          icon: "edit_square",
          label: "Select",
          isActive: isSelectActive,
          onClick: handleSelect,
        },
      ],
    },
    {
      id: "draw",
      buttonCount: 2,
      buttons: (
        <>
          <AddZoneButton />
          <AddObstacleButton />
        </>
      ),
      trailingSeparator: "thin",
      overflowItems: [
        {
          id: "add-zone",
          icon: "rectangle_add",
          label: "Add Zone",
          isActive: isAddZoneActive,
          onClick: handleAddZone,
        },
        {
          id: "add-obstacle",
          icon: "add_triangle",
          label: "Add Obstacle",
          isActive: isAddObstacleActive,
          onClick: handleAddObstacle,
        },
      ],
    },
    {
      id: "points",
      buttonCount: 2,
      buttons: (
        <>
          <AddStartPointButton />
          <AddEndPointButton />
        </>
      ),
      trailingSeparator: "thin",
      overflowItems: [
        {
          id: "add-start-point",
          icon: "trip_origin",
          label: "Add Start Point",
          isActive: isAddStartPointActive,
          onClick: handleAddStartPoint,
        },
        {
          id: "add-end-point",
          icon: "flag",
          label: "Add End Point",
          isActive: isAddEndPointActive,
          onClick: handleAddEndPoint,
        },
      ],
    },
    {
      id: "delete",
      buttonCount: 1,
      buttons: <DeleteButton />,
      trailingSeparator: "thick",
      overflowItems: [
        {
          id: "delete",
          icon: "delete",
          label: "Delete",
          isActive: isDeleteActive,
          onClick: handleDelete,
        },
      ],
    },
    {
      id: "coverage",
      buttonCount: 2,
      buttons: (
        <>
          <ExecuteCppButton />
          <ClearCppButton />
        </>
      ),
      trailingSeparator: "thin",
      overflowItems: [
        {
          id: "execute-cpp",
          icon: "motion_play",
          label: "Execute coverage path planning",
          isDisabled: isBusy,
          onClick: handleExecuteCpp,
        },
        {
          id: "clear-cpp",
          icon: "ink_eraser",
          label: "Clear coverage path planning output",
          onClick: () => { },
        },
      ],
    },
    {
      id: "jobs",
      buttonCount: 1,
      buttons: <OpenJobListButton />,
      overflowItems: [
        {
          id: "jobs",
          icon: "assignment",
          label: "Open jobs...",
          onClick: () => { },
        },
      ],
    },
  ];

  const { containerRef, ghostRef, groupRefs, visibleCount } =
    useToolBarOverflow(groups.length);

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1 bg-gray-100 border-b border-gray-300">
      {/* Left cluster — ref'd for available-width measurement */}
      <div ref={containerRef} className="relative flex-1 min-w-0">
        {/* Ghost row: invisible, renders all groups to measure their natural widths */}
        <div
          ref={ghostRef}
          aria-hidden="true"
          className="absolute top-0 left-0 invisible pointer-events-none flex items-center gap-2"
        >
          {groups.map((group, i) => (
            <div
              key={group.id}
              ref={(el) => {
                groupRefs.current[i] = el;
              }}
              className="flex items-center gap-2"
            >
              {Array.from({ length: group.buttonCount }, (_, j) => (
                <div key={j} className="w-8 h-8" />
              ))}
              {group.trailingSeparator === "thick" && (
                <div className="mx-1 w-px h-6" />
              )}
              {group.trailingSeparator === "thin" && (
                <div className="mx-1 w-px h-4" />
              )}
            </div>
          ))}
        </div>

        {/* Real row: only the groups that fit */}
        <div className="flex items-center gap-2">
          {groups.slice(0, visibleCount).map((group) => (
            <div key={group.id} className="flex items-center gap-2">
              {group.buttons}
              {group.trailingSeparator === "thick" && <ToolGroupSeparator />}
              {group.trailingSeparator === "thin" && <ToolSeparator />}
            </div>
          ))}

          {visibleCount < groups.length && (
            <ToolBarMoreButton groups={groups.slice(visibleCount)} />
          )}
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2 shrink-0">
        <UiInspectorButton />
      </div>
    </div>
  );
}
