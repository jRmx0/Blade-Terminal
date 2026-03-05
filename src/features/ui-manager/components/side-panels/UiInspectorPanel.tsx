import { useRef, useEffect, useState } from "react";
import { useUiInspectorPanelStore } from "@/features/ui-manager/stores/uiInspectorPanelStore";
import { useUiControlsPanelStore } from "@/features/ui-manager/stores/uiControlsPanelStore";

interface UiInspectorPanelProps {
  children: React.ReactNode;
}

const MIN_WIDTH = 150;
const MAX_WIDTH = 600;
const COLLAPSE_THRESHOLD = MIN_WIDTH / 2;

export default function UiInspectorPanel({ children }: UiInspectorPanelProps) {
  const isVisible = useUiInspectorPanelStore((state) => state.isVisible);
  const setVisibility = useUiInspectorPanelStore((state) => state.setVisibility);
  const width = useUiInspectorPanelStore((state) => state.width);
  const setWidth = useUiInspectorPanelStore((state) => state.setWidth);
  const [isResizing, setResizing] = useState(false);
  const [isDragCollapsed, setDragCollapsed] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isDragCollapsedRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === resizeHandleRef.current) {
        isDraggingRef.current = true;
        startXRef.current = e.clientX;
        startWidthRef.current = useUiInspectorPanelStore.getState().width;
        setResizing(true);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      // Inspector is on the right — dragging left (negative clientX diff) increases width
      const rawWidth = startWidthRef.current + (startXRef.current - e.clientX);

      if (rawWidth < COLLAPSE_THRESHOLD) {
        if (!isDragCollapsedRef.current) {
          isDragCollapsedRef.current = true;
          setDragCollapsed(true);
        }
      } else {
        if (isDragCollapsedRef.current) {
          isDragCollapsedRef.current = false;
          setDragCollapsed(false);
        }
        const containerWidth = panelRef.current?.parentElement?.clientWidth ?? Infinity;
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, rawWidth));
        setWidth(newWidth);
        // Push controls if inspector grows into it
        const controlsState = useUiControlsPanelStore.getState();
        if (controlsState.isVisible) {
          const leftover = containerWidth - newWidth;
          if (controlsState.width > leftover) {
            controlsState.setWidth(Math.max(MIN_WIDTH, leftover));
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        if (isDragCollapsedRef.current) {
          isDragCollapsedRef.current = false;
          setDragCollapsed(false);
          setVisibility(false);
        }
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setWidth, setVisibility]);

  const hidden = !isVisible || isDragCollapsed;

  return (
    <div
      ref={panelRef}
      style={{ width: hidden ? 0 : `${width}px` }}
      className="relative flex flex-col h-full shrink-0 bg-gray-100 overflow-hidden select-none pointer-events-auto"
    >
      {!hidden && (
        <>
          <div className="flex flex-col h-full overflow-auto">{children}</div>

          <div
            ref={resizeHandleRef}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize select-none group"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 pointer-events-none transition-[width,background-color] delay-0 ${isResizing
                ? "w-1 bg-blue-500"
                : "w-px bg-gray-300 group-hover:w-1 group-hover:bg-blue-500 group-hover:delay-300"
                }`}
            />
          </div>
        </>
      )}
    </div>
  );
}
