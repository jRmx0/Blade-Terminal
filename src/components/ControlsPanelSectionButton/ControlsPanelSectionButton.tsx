import type { ControlsPanelSectionButtonProps } from "@/types/controlsPanel";

export default function ControlsPanelSectionButton({
  label,
  onClick,
  disabled = false,
  variant = 'default',
}: ControlsPanelSectionButtonProps) {
  const baseStyles =
    "w-full px-3 py-2 rounded text-sm font-medium cursor-pointer select-none transition-colors";
  const defaultStyles =
    "text-gray-700 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed";
  const dangerStyles =
    "text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 disabled:text-red-300 disabled:bg-red-50 disabled:cursor-not-allowed";

  const variantStyles = variant === 'danger' ? dangerStyles : defaultStyles;
  const className = `${baseStyles} ${variantStyles}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {label}
    </button>
  );
}
