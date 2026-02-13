import MenuBarListButton from "../../../../components/MenuBarListButton/MenuBarListButton";

export default function WorkspaceSaveButton() {
  const handleClick = () => {};

  return (
    <MenuBarListButton
      label="Save"
      shortcut={["Ctrl", "S"]}
      onClick={handleClick}
    />
  );
}
