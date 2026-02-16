import { useState } from "react";
import ToggleToolBarButton from "@/components/ToggleToolBarButton/ToggleToolBarButton";

export default function UiInspectorButton() {
  const [isToggled, setIsToggled] = useState(false);

  return (
    <ToggleToolBarButton
      titleOff="Open Inspector Panel"
      titleOn="Close Inspector Panel"
      iconOff="right_panel_open"
      iconOn="right_panel_close"
      isToggled={isToggled}
      onChange={setIsToggled}
    />
  );
}
