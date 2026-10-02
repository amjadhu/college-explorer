"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function NotesEditor({ value, onChange }: Props) {
  const [draft, setDraft] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setDraft(newValue);

    // Debounce save
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 500);
  };

  return (
    <div className="workspace-notes">
      <textarea
        placeholder="Add notes about this school..."
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
}
