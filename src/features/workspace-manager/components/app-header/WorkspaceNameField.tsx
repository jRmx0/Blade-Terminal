import { useEffect, useRef, useState } from "react";

interface WorkspaceNameFieldProps {
  initialName?: string;
  onChange?: (name: string) => void;
}

export default function WorkspaceNameField({
  initialName = "Untitled Workspace",
  onChange,
}: WorkspaceNameFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEditing() {
    setDraft(name);
    setIsEditing(true);
  }

  function commit() {
    const trimmed = draft.trim() || name;
    setName(trimmed);
    setIsEditing(false);
    onChange?.(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setIsEditing(false);
  }

  const sharedClass = "px-2 py-1 text-xl text-gray-700 bg-gray-100 rounded";

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        maxLength={100}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`${sharedClass} outline-none ring-2 ring-blue-400 cursor-text`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      title="Rename"
      className={`${sharedClass} cursor-pointer select-none hover:bg-gray-200 active:bg-gray-300 transition-colors`}
    >
      {name}
    </button>
  );
}
