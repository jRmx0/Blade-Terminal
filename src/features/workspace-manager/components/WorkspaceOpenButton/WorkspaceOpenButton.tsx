import MenuBarListButton from "../../../../components/MenuBarListButton/MenuBarListButton";

export default function WorkspaceOpenButton() {
  const handleClick = () => {};

  return (
    <MenuBarListButton
      label="Open..."
      shortcut={["Ctrl", "O"]}
      onClick={handleClick}
    />
  );
}
