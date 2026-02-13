import WorkspaceNewButton from "@/features/workspace-manager/components/WorkspaceNewButton/WorkspaceNewButton";
import WorkspaceSaveButton from "@/features/workspace-manager/components/WorkspaceSaveButton/WorkspaceSaveButton";
import WorkspaceSaveAsButton from "@/features/workspace-manager/components/WorkspaceSaveAsButton/WorkspaceSaveAsButton";
import WorkspaceRenameButton from "@/features/workspace-manager/components/WorkspaceRenameButton/WorkspaceRenameButton";
import WorkspaceCopyButton from "@/features/workspace-manager/components/WorkspaceCopyButton/WorkspaceCopyButton";
import WorkspaceImportButton from "@/features/workspace-manager/components/WorkspaceImportButton/WorkspaceImportButton";
import WorkspaceExportButton from "@/features/workspace-manager/components/WorkspaceExportButton/WorkspaceExportButton";
import WorkspaceCloseButton from "@/features/workspace-manager/components/WorkspaceCloseButton/WorkspaceCloseButton";
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
