interface WorkspaceNameFieldProps {
  onClick?: () => void;
}

export default function WorkspaceNameField({
  onClick,
}: WorkspaceNameFieldProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Rename"
      className="px-2 py-1 text-xl text-gray-700 bg-gray-100 rounded cursor-pointer select-none"
    >
      Untitled Workspace
    </button>
  );
}
