import MenuBarItem from "@/components/menu-bar/MenuBarItem";

export default function CanvasResetViewButton() {
  const handleClick = () => {
    // TODO: Reset canvas view to default pan/zoom
  };

  return <MenuBarItem label="Reset View" onClick={handleClick} />;
}
