import MenuBarFileButton from "@/components/MenuBarFileButton/MenuBarFileButton";
import MenuBarViewButton from "@/components/MenuBarViewButton/MenuBarViewButton";

export default function MenuBar() {
  return (
    <div className="flex items-center">
      <MenuBarFileButton />
      <MenuBarViewButton />
    </div>
  );
}
