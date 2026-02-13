import MenuBarItem from "@/components/MenuBarItem/MenuBarItem";

export default function UiStatusBarButton() {
  const handleClick = () => {
    // TODO: Toggle status bar visibility
  };

  return (
    <MenuBarItem
      label="Status Bar"
      shortcut={["Ctrl", "Alt", "S"]}
      hasCheckmark
      defaultChecked={true}
      onClick={handleClick}
    />
  );
}
