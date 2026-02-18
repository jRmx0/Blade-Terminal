import { useRef, useEffect } from "react";
import { useUiControlsPanelStore } from "@/features/ui-manager/stores/uiControlsPanelStore";

interface UiControlsPanelProps {
  children: React.ReactNode;
}

const MIN_WIDTH = 150;
const MAX_WIDTH = 600;

export default function UiControlsPanel({ children }: UiControlsPanelProps) {
  const isVisible = useUiControlsPanelStore((state) => state.isVisible);
  const isResizing = useUiControlsPanelStore((state) => state.isResizing);
  const width = useUiControlsPanelStore((state) => state.width);
  const setWidth = useUiControlsPanelStore((state) => state.setWidth);
  const setResizing = useUiControlsPanelStore((state) => state.setResizing);

  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === resizeHandleRef.current) {
        isDraggingRef.current = true;
        startXRef.current = e.clientX;
        startWidthRef.current = width;
        setResizing(true);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, startWidthRef.current + deltaX),
      );
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
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
  }, [width, setWidth]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{ width: `${width}px` }}
      className="relative flex flex-col h-full bg-gray-50 overflow-auto"
    >
      {children}

      <div
        ref={resizeHandleRef}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize select-none group"
      >
        <div
          className={`absolute right-0 top-0 bottom-0 pointer-events-none transition-[width,background-color] ${
            isResizing
              ? "w-1 bg-gray-400"
              : "w-px bg-gray-300 group-hover:w-1 group-hover:bg-gray-400"
          }`}
        />
      </div>
    </div>
  );
}
