import WorkspaceNameField from "@/features/workspace-manager/components/WorkspaceNameField/WorkspaceNameField";

export default function TitleBar() {
  return (
    <div className="flex items-center px-2 py-1">
      <WorkspaceNameField />
    </div>
  );
}
