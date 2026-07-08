"use client";

import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  taskId: string;
  status: string;
  onToggled: () => void;
}

export default function TaskCompleteToggle({ taskId, status, onToggled }: Props) {
  const supabase = createClient();
  const isComplete = status === "Completed";

  const handleClick = async () => {
    const newStatus = isComplete ? "Not started" : "Completed";
    const completed_date = newStatus === "Completed" ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus, completed_date })
        .eq("id", taskId);

      if (error) throw error;
      onToggled();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error updating task");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isComplete ? "Mark task not started" : "Mark task complete"}
      aria-pressed={isComplete}
      className={cn(
        "focus-ring flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors",
        isComplete
          ? "border-primary-container bg-primary-container text-white"
          : "border-outline-variant hover:border-primary",
      )}
    >
      {isComplete ? <Check className="h-3.5 w-3.5" /> : null}
    </button>
  );
}
