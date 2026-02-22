interface ToolBarButtonProps {
  title: string;
  icon: string;
  onClick?: () => void;
}

export default function ToolBarButton({
  title,
  icon,
  onClick,
}: ToolBarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:text-gray-900 active:text-gray-800 hover:bg-gray-200 active:bg-gray-300 cursor-pointer select-none"
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}
