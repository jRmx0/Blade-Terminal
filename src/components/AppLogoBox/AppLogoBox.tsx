import btHexLogo from "@/assets/bt-hex.svg";

export default function AppLogoBox() {
  return (
    <div className="w-12 h-12 p-0.5 bg-white-500 rounded-lg">
      <img src={btHexLogo} alt="Blade Terminal" className="w-full h-full" />
    </div>
  );
}
