import MenuBarItem from "@/components/menu-bar/MenuBarItem";

export default function WorkspaceSaveAsButton() {
  const handleClick = () => {};

  return (
    <MenuBarItem
      label="Save As..."
      shortcut={["Ctrl", "Shift", "S"]}
      onClick={handleClick}
    />
  );
}
