import WorkspaceNewButton from "@/features/workspace-manager/components/menu-bar/WorkspaceNewButton";
import WorkspaceSaveButton from "@/features/workspace-manager/components/menu-bar/WorkspaceSaveButton";
import WorkspaceSaveAsButton from "@/features/workspace-manager/components/menu-bar/WorkspaceSaveAsButton";
import WorkspaceRenameButton from "@/features/workspace-manager/components/menu-bar/WorkspaceRenameButton";
import WorkspaceCopyButton from "@/features/workspace-manager/components/menu-bar/WorkspaceCopyButton";
import WorkspaceImportButton from "@/features/workspace-manager/components/menu-bar/WorkspaceImportButton";
import WorkspaceExportButton from "@/features/workspace-manager/components/menu-bar/WorkspaceExportButton";
// import WorkspaceCloseButton from "@/features/workspace-manager/components/menu-bar/WorkspaceCloseButton";
import MenuSeparator from "@/components/menu-bar/MenuBarSeparator";
import WorkspaceOpenButton from "@/features/workspace-manager/components/menu-bar/WorkspaceOpenButton";
import WorkspaceAutoSaveButton from "@/features/workspace-manager/components/menu-bar/WorkspaceAutoSaveButton";

export default function MenuBarFileSubmenu() {
  return (
    <div className="w-80 py-1 bg-gray-100">
      <WorkspaceNewButton />
      <WorkspaceOpenButton />

      <MenuSeparator />

      <WorkspaceSaveButton />
      <WorkspaceSaveAsButton />

      <MenuSeparator />

      <WorkspaceRenameButton />
      <WorkspaceCopyButton />

      <MenuSeparator />

      <WorkspaceAutoSaveButton />

      <MenuSeparator />

      <WorkspaceImportButton />
      <WorkspaceExportButton />

      {/* TODO: Home screen */}
      {/* <MenuSeparator />

      <WorkspaceCloseButton /> */}
    </div>
  );
}
