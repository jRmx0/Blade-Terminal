import ToolBarButton from "@/components/tool-bar/ToolBarButton";
import { submitComputeRequest } from "@/features/coverage-planning/data/computeService";

export default function ExecuteCppButton() {
  function handleClick() {
    submitComputeRequest().then((result) => {
      console.log("[ExecuteCpp] result:", result);
    });
  }

  return (
    <ToolBarButton
      title="Execute coverage path planning"
      icon="motion_play"
      onClick={handleClick}
    />
  );
}
