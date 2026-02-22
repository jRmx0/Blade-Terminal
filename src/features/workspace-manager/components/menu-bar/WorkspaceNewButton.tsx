import MenuBarItem from "@/components/menu-bar/MenuBarItem";

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
