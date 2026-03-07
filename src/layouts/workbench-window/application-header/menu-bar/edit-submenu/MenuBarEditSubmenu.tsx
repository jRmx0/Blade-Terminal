import CanvasUndoButton from "@/features/canvas-editing/components/menu-bar/CanvasUndoButton";
import CanvasRedoButton from "@/features/canvas-editing/components/menu-bar/CanvasRedoButton";

export default function MenuBarEditSubmenu() {
    return (
        <div className="w-80 py-1 bg-gray-100">
            <CanvasUndoButton />
            <CanvasRedoButton />
        </div>
    );
}
