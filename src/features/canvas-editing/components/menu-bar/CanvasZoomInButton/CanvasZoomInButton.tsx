import MenuBarItem from "@/components/menu-bar/MenuBarItem";

export default function CanvasZoomInButton() {
  const handleClick = () => {
    // TODO: Increase canvas zoom level
  };

  return (
    <MenuBarItem
      label="Zoom In"
      shortcut={["Ctrl", "+"]}
      onClick={handleClick}
    />
  );
}
