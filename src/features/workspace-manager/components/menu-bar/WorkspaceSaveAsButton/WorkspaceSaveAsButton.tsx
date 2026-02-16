import MenuBarItem from "@/components/MenuBarItem/MenuBarItem";

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
