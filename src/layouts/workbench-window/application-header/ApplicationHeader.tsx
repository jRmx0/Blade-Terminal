import AppLogoBox from "@/components/AppLogoBox/AppLogoBox";
import TitleBar from "./title-bar/TitleBar";
import MenuBar from "./menu-bar/MenuBar";

export default function ApplicationHeader() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-100 border border-gray-300">
      <div className="shrink-0">
        <AppLogoBox />
      </div>
      <div className="flex flex-col">
        <TitleBar />
        <MenuBar />
      </div>
    </div>
  );
}
