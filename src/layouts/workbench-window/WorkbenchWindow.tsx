import AppLogoBox from "@/components/AppLogoBox/AppLogoBox";
import TitleBar from "./application-header/title-bar/TitleBar";

export default function WorkbenchWindow() {
  return (
    <div className="flex flex-col w-full h-full">
      <TitleBar />
      <AppLogoBox />
    </div>
  );
}
