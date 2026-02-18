import { useUiControlsPanelStore } from "@/features/ui-manager/stores/uiControlsPanelStore";

interface UiControlsPanelProps {
  children: React.ReactNode;
}

export default function UiControlsPanel({ children }: UiControlsPanelProps) {
  const isVisible = useUiControlsPanelStore((state) => state.isVisible);
  const width = useUiControlsPanelStore((state) => state.width);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{ width: `${width}px` }}
      className="flex flex-col h-full bg-gray-50 border-l border-gray-200 overflow-auto"
    >
      {children}
    </div>
  );
}
