"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const schoolStatuses = ["New", "Contacted", "No Answer", "Interested", "Follow-up", "Connected", "Declined"] as const;

export type SchoolStatus = (typeof schoolStatuses)[number];

interface SchoolStatusSelectProps {
  id: string;
  value: SchoolStatus;
  onSaved?: (value: SchoolStatus) => void;
}

export function SchoolStatusSelect({ id, value, onSaved }: SchoolStatusSelectProps) {
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleChange(nextValue: SchoolStatus) {
    const previousValue = value;
    onSaved?.(nextValue);
    setSaving(true);

    const { error } = await supabase
      .from("language_schools")
      .update({ status: nextValue })
      .eq("id", id);

    setSaving(false);

    if (error) {
      console.error(error);
      onSaved?.(previousValue);
      alert("Error updating school status");
    }
  }

  return (
    <select
      aria-label="School status"
      disabled={saving}
      value={value}
      onChange={event => handleChange(event.target.value as SchoolStatus)}
      className="inline-flex max-w-full rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 outline-none transition-colors hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-blue-800/60 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
    >
      {schoolStatuses.map(status => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}
