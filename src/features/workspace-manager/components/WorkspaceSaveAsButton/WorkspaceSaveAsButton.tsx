import MenuBarListButton from "../../../../components/MenuBarListButton/MenuBarListButton";

export default function WorkspaceSaveAsButton() {
  const handleClick = () => {};

  return (
    <MenuBarListButton
      label="Save As..."
      shortcut={["Ctrl", "Shift", "S"]}
      onClick={handleClick}
    />
  );
}
