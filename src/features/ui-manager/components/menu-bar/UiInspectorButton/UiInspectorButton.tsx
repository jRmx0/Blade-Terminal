import MenuBarItem from "@/components/MenuBarItem/MenuBarItem";

export default function UiInspectorButton() {
  const handleClick = () => {
    // TODO: Toggle inspector side panel visibility
  };

  return (
    <MenuBarItem
      label="Inspector"
      shortcut={["Ctrl", "Alt", "I"]}
      hasCheckmark
      defaultChecked={true}
      onClick={handleClick}
    />
  );
}
