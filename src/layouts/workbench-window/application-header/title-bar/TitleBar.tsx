import WorkspaceNameField from "@/features/workspace-manager/components/app-header/WorkspaceNameField";

export default function TitleBar() {
  return (
    <div className="flex items-center">
      <WorkspaceNameField />
    </div>
  );
}
