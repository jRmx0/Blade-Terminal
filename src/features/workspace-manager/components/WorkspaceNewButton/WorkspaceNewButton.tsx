import MenuBarItem from "../../../../components/MenuBarItem/MenuBarItem";

export default function WorkspaceNewButton() {
  const handleClick = () => {};

  return (
    <MenuBarItem
      label="New..."
      shortcut={["Ctrl", "N"]}
      onClick={handleClick}
    />
  );
}
