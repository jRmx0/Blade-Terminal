interface MenuBarButtonProps {
  label: string;
  onClick?: () => void;
}

export default function MenuBarButton({ label, onClick }: MenuBarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1 text-base text-gray-700 rounded hover:bg-gray-200 active:bg-gray-300"
    >
      {label}
    </button>
  );
}
