import UiStatusBar from "@/features/ui-manager/components/status-bar/UiStatusBar";
import SaveStateButton from "@/features/workspace-manager/components/status-bar/SaveStateButton";

export default function StatusBar() {
  return <UiStatusBar leftChildren={<SaveStateButton />} />;
}
