import WorkspaceNewButton from "@/features/workspace-manager/components/menu-bar/WorkspaceNewButton/WorkspaceNewButton";
import WorkspaceSaveButton from "@/features/workspace-manager/components/menu-bar/WorkspaceSaveButton/WorkspaceSaveButton";
import WorkspaceSaveAsButton from "@/features/workspace-manager/components/menu-bar/WorkspaceSaveAsButton/WorkspaceSaveAsButton";
import WorkspaceRenameButton from "@/features/workspace-manager/components/menu-bar/WorkspaceRenameButton/WorkspaceRenameButton";
import WorkspaceCopyButton from "@/features/workspace-manager/components/menu-bar/WorkspaceCopyButton/WorkspaceCopyButton";
import WorkspaceImportButton from "@/features/workspace-manager/components/menu-bar/WorkspaceImportButton/WorkspaceImportButton";
import WorkspaceExportButton from "@/features/workspace-manager/components/menu-bar/WorkspaceExportButton/WorkspaceExportButton";
import WorkspaceCloseButton from "@/features/workspace-manager/components/menu-bar/WorkspaceCloseButton/WorkspaceCloseButton";
import MenuSeparator from "@/components/MenuSeparator/MenuSeparator";

export default function MenuBarFileList() {
  return (
    <div className="w-64 py-1 bg-gray-100">
      <WorkspaceNewButton />

      <MenuSeparator />

      <WorkspaceSaveButton />
      <WorkspaceSaveAsButton />

      <MenuSeparator />

      <WorkspaceRenameButton />
      <WorkspaceCopyButton />

      <MenuSeparator />

      <WorkspaceImportButton />
      <WorkspaceExportButton />

      <MenuSeparator />

      <WorkspaceCloseButton />
    </div>
  );
}
