import MenuBarItem from "@/components/menu-bar/MenuBarItem";
import { useEnvStore } from "@/stores/envStore";
import { useCanvasObjectStore } from "@/features/canvas-editing/stores/canvasObjectStore";
import { buildExportXml } from "@/features/workspace-manager/utils/exportWorkspace";

export default function WorkspaceExportButton() {
  const env = useEnvStore((s) => s.env);
  const objects = useCanvasObjectStore((s) => s.objects);

  const handleClick = async () => {
    const xml = buildExportXml(env, objects);

    let fileHandle: FileSystemFileHandle;
    try {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: `${env.name}.xml`,
        types: [
          {
            description: "XML file",
            accept: { "application/xml": [".xml"] },
          },
        ],
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("[WorkspaceExportButton] showSaveFilePicker failed:", err);
      return;
    }

    try {
      const writable = await fileHandle.createWritable();
      await writable.write(xml);
      await writable.close();
    } catch (err) {
      console.error("[WorkspaceExportButton] File write failed:", err);
    }
  };

  return <MenuBarItem label="Export..." onClick={handleClick} />;
}
