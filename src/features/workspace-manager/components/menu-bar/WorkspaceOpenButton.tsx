import MenuBarItem from "@/components/menu-bar/MenuBarItem";

export default function WorkspaceOpenButton() {
  const handleClick = () => {};

  return (
    <MenuBarItem
      label="Open..."
      shortcut={["Ctrl", "O"]}
      onClick={handleClick}
    />
  );
}
