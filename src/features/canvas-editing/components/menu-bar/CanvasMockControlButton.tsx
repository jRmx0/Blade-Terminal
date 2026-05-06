import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useCanvasFloatingControlStore } from "@/features/canvas-editing/stores/canvasFloatingControlStore";

export default function CanvasMockControlButton() {
    const isOpen = useCanvasFloatingControlStore((state) => state.isOpen);
    const setOpen = useCanvasFloatingControlStore((state) => state.setOpen);

    return (
        <MenuBarItem
            label="Mock Control"
            hasCheckmark
            defaultChecked={isOpen}
            onClick={() => setOpen(!isOpen)}
        />
    );
}
