import MenuBarItem from "@/components/menu-bar/MenuBarItem";

export default function WorkspaceSaveButton() {
  const handleClick = () => {};

  return (
    <MenuBarItem label="Save" shortcut={["Ctrl", "S"]} onClick={handleClick} />
  );
}
