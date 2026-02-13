import MenuBarItem from "@/components/MenuBarItem/MenuBarItem";

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
