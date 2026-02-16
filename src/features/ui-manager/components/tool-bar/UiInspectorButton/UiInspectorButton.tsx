import { useState } from "react";
import ToggleToolBarButton from "@/components/ToggleToolBarButton/ToggleToolBarButton";

export default function UiInspectorButton() {
  const [isToggled, setIsToggled] = useState(false);

  return (
    <ToggleToolBarButton
      titleOff="Expand inspector panel"
      titleOn="Collapse inspector panel"
      iconOff="right_panel_open"
      iconOn="right_panel_close"
      isToggled={isToggled}
      onChange={setIsToggled}
    />
  );
}
