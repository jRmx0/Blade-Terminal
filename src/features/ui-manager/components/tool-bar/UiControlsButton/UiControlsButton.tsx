import { useState } from "react";
import ToggleToolBarButton from "@/components/ToggleToolBarButton/ToggleToolBarButton";

export default function UiControlsButton() {
  const [isToggled, setIsToggled] = useState(false);

  return (
    <ToggleToolBarButton
      titleOff="Expand controls panel"
      titleOn="Collapse controls panel"
      iconOff="left_panel_open"
      iconOn="left_panel_close"
      isToggled={isToggled}
      onChange={setIsToggled}
    />
  );
}
