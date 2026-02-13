import MenuBarListButton from "../../../../components/MenuBarListButton/MenuBarListButton";

export default function WorkspaceNewButton() {
  const handleClick = () => {};

  return (
    <MenuBarListButton
      label="New..."
      shortcut={["Ctrl", "N"]}
      onClick={handleClick}
    />
  );
}
