"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DateField from "@/components/DateField";

type EntityType = 'task' | 'donor' | 'church' | 'project' | 'language_school';
type NextStepEntityType = 'donor' | 'church' | 'language_school';

const nextStepParentTables: Record<NextStepEntityType, string> = {
  donor: 'donors',
  church: 'churches',
  language_school: 'language_schools',
};

const followUpParentColumns: Record<NextStepEntityType, string> = {
  donor: 'next_follow_up_date',
  church: 'next_visit_date',
  language_school: 'next_follow_up_date',
};

function canSyncNextStep(entityType: EntityType): entityType is NextStepEntityType {
  return entityType in nextStepParentTables;
}

interface Props {
  entityType: EntityType;
  entityId: string;
  entityLabel?: string;
  onNextStepSaved?: (nextStep: string) => void;
  onFollowUpDateSaved?: (followUpDate: string) => void;
}

interface ProfileJoin {
  full_name: string | null;
  email: string | null;
}

interface NoteRow {
  id: string;
  body: string;
  next_step: string | null;
  follow_up_date: string | null;
  created_at: string;
  created_by: string | null;
  profiles: ProfileJoin | ProfileJoin[] | null;
}

function getAuthorName(profiles: NoteRow['profiles'], fallback: string | null) {
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  return profile?.full_name || profile?.email || fallback || "Unknown";
}

export default function NotesLog({
  entityType,
  entityId,
  entityLabel,
  onNextStepSaved,
  onFollowUpDateSaved,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [body, setBody] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showNextStep = canSyncNextStep(entityType);
  const label = entityLabel || entityType.replace("_", " ");

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('id, body, next_step, follow_up_date, created_at, created_by, profiles(full_name, email)')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data || []) as NoteRow[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading notes");
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBody = body.trim();
    const trimmedNextStep = showNextStep ? nextStep.trim() : "";
    const trimmedFollowUpDate = showNextStep ? followUpDate.trim() : "";
    if (!trimmedBody && !trimmedNextStep && !trimmedFollowUpDate) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const noteBody = trimmedBody || "(no note text)";
      const { error } = await supabase.from('notes').insert({
        entity_type: entityType,
        entity_id: entityId,
        body: noteBody,
        next_step: trimmedNextStep || null,
        follow_up_date: trimmedFollowUpDate || null,
        created_by: user?.id || null,
      });

      if (error) throw error;

      if (canSyncNextStep(entityType)) {
        const parentUpdate: Record<string, string> = {};
        if (trimmedNextStep) {
          parentUpdate.next_step = trimmedNextStep;
        }
        if (trimmedFollowUpDate) {
          parentUpdate[followUpParentColumns[entityType]] = trimmedFollowUpDate;
        }

        if (Object.keys(parentUpdate).length > 0) {
          const { error: parentError } = await supabase
            .from(nextStepParentTables[entityType])
            .update(parentUpdate)
            .eq('id', entityId);

          if (parentError) throw parentError;
        }

        if (trimmedNextStep) {
          onNextStepSaved?.(trimmedNextStep);
        }
        if (trimmedFollowUpDate) {
          onFollowUpDateSaved?.(trimmedFollowUpDate);
        }
      }

      if (trimmedNextStep && trimmedFollowUpDate) {
        const { error: parentError } = await supabase
          .from('tasks')
          .insert({
            title: `Follow up: ${trimmedNextStep}`,
            description: `Automatically created from a note on ${label}. Notes: ${noteBody}`,
            assigned_to: user?.id,
            related_to_id: entityId,
            related_to_type: entityType,
            due_date: new Date(trimmedFollowUpDate).toISOString(),
            priority: 'Medium',
            status: 'Not started',
          });

        if (parentError) throw parentError;
      }

      setBody("");
      setNextStep("");
      setFollowUpDate("");
      await fetchNotes();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error adding note");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = body.trim().length > 0 || (showNextStep && (nextStep.trim().length > 0 || followUpDate.trim().length > 0));

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddNote} className="space-y-3">
        <p className="text-sm text-zinc-500">
          {entityType === 'task'
            ? "Add a note or progress update."
            : "Notes are for internal updates, quick thoughts, or anything that isn't a direct interaction — they don't count as contact. Use Log Contact/Visit above for an actual call, email, or meeting."}
        </p>
        <textarea
          className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-y text-sm"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Add a note..."
        />
        {showNextStep ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Next Step</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={nextStep}
                onChange={e => setNextStep(e.target.value)}
                placeholder="Optional next step..."
              />
            </div>
            <DateField
              label="Follow-up Date"
              value={followUpDate}
              onChange={setFollowUpDate}
            />
          </div>
        ) : null}
        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add note
        </button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading notes...
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">Error loading notes: {error}</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-zinc-500 italic">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="rounded-lg border p-4 dark:border-zinc-800">
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{note.body}</p>
              {note.next_step ? (
                <p className="mt-2 text-sm font-medium text-blue-700 dark:text-blue-400">Next step: {note.next_step}</p>
              ) : null}
              {note.follow_up_date ? (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Follow-up: {note.follow_up_date}</p>
              ) : null}
              <p className="mt-3 text-xs text-zinc-500">
                {new Date(note.created_at).toLocaleString()} by {getAuthorName(note.profiles, note.created_by)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
