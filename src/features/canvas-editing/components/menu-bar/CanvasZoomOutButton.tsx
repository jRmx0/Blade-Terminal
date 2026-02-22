import MenuBarItem from "@/components/menu-bar/MenuBarItem";

export default function CanvasZoomOutButton() {
  const handleClick = () => {
    // TODO: Decrease canvas zoom level
  };

  return (
    <MenuBarItem
      label="Zoom Out"
      shortcut={["Ctrl", "-"]}
      onClick={handleClick}
    />
  );
}
