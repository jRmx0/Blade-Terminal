import { useEffect, useRef, useState } from "react";
import { useEnvStore } from "@/stores/envStore";
import { WORKSPACE_NAME_MAX_LENGTH } from "@/config/db-ops/databaseConstraintsConfig";
import { useShortcutsBlocked } from "@/hooks/shortcut-manager/useShortcutsBlocked";

export default function WorkspaceNameField() {
  const name = useEnvStore((state) => state.env.name);
  const setName = useEnvStore((state) => state.setName);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useShortcutsBlocked("workspace-name-field", isEditing);

  useEffect(() => {
    if (isEditing) {
      setDraft(name);
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEditing() {
    setIsEditing(true);
  }

  function commit() {
    const trimmed = draft.trim() || name;
    setName(trimmed);
    setIsEditing(false);
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
        maxLength={WORKSPACE_NAME_MAX_LENGTH}
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
