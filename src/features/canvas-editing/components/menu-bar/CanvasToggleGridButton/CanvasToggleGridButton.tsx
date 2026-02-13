import MenuBarItem from "@/components/MenuBarItem/MenuBarItem";

export default function CanvasToggleGridButton() {
  const handleClick = () => {
    // TODO: Toggle helper grid visibility on canvas
  };

  return (
    <MenuBarItem
      label="Toggle Grid"
      shortcut={["Ctrl", "G"]}
      hasCheckmark
      defaultChecked={true}
      onClick={handleClick}
    />
  );
}
