import MenuBarItem from "@/components/MenuBarItem/MenuBarItem";

export default function UiControlsButton() {
  const handleClick = () => {
    // TODO: Toggle controls side panel visibility
  };

  return (
    <MenuBarItem
      label="Controls"
      shortcut={["Ctrl", "Alt", "C"]}
      hasCheckmark
      defaultChecked={true}
      onClick={handleClick}
    />
  );
}
