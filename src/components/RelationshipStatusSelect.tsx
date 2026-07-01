"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const relationshipStatuses = ["Engaged", "Steady", "Cooling", "At risk", "Inactive"] as const;

export type RelationshipStatus = (typeof relationshipStatuses)[number];

interface RelationshipStatusSelectProps {
  id: string;
  table: "donors" | "churches";
  value: RelationshipStatus;
  onSaved?: (value: RelationshipStatus) => void;
}

export function RelationshipStatusSelect({ id, table, value, onSaved }: RelationshipStatusSelectProps) {
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleChange(nextValue: RelationshipStatus) {
    const previousValue = value;
    onSaved?.(nextValue);
    setSaving(true);

    const { error } = await supabase
      .from(table)
      .update({ relationship_status: nextValue })
      .eq("id", id);

    setSaving(false);

    if (error) {
      console.error(error);
      onSaved?.(previousValue);
      alert("Error updating relationship status");
    }
  }

  return (
    <select
      aria-label="Relationship status"
      disabled={saving}
      value={value}
      onChange={event => handleChange(event.target.value as RelationshipStatus)}
      className="inline-flex max-w-full rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 outline-none transition-colors hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-blue-800/60 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
    >
      {relationshipStatuses.map(status => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}
