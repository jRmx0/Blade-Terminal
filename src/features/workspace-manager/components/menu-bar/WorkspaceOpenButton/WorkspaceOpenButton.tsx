import MenuBarItem from "@/components/MenuBarItem/MenuBarItem";

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
