import MenuBarItem from "../../../../components/MenuBarItem/MenuBarItem";

export default function WorkspaceSaveButton() {
  const handleClick = () => {};

  return (
    <MenuBarItem label="Save" shortcut={["Ctrl", "S"]} onClick={handleClick} />
  );
}
