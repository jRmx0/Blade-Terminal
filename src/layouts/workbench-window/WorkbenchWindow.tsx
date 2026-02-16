import ApplicationHeader from "./application-header/ApplicationHeader";
import ToolBar from "./tool-bar/ToolBar";

export default function WorkbenchWindow() {
  return (
    <div className="flex flex-col w-full h-full">
      <ApplicationHeader />
      <ToolBar />
    </div>
  );
}
