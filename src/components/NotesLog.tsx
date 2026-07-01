"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EntityType = 'task' | 'donor' | 'church' | 'project' | 'language_school';
type NextStepEntityType = 'donor' | 'church' | 'language_school';

const nextStepParentTables: Record<NextStepEntityType, string> = {
  donor: 'donors',
  church: 'churches',
  language_school: 'language_schools',
};

function canSyncNextStep(entityType: EntityType): entityType is NextStepEntityType {
  return entityType in nextStepParentTables;
}

interface Props {
  entityType: EntityType;
  entityId: string;
  onNextStepSaved?: (nextStep: string) => void;
}

interface ProfileJoin {
  full_name: string | null;
  email: string | null;
}

interface NoteRow {
  id: string;
  body: string;
  next_step: string | null;
  created_at: string;
  created_by: string | null;
  profiles: ProfileJoin | ProfileJoin[] | null;
}

function getAuthorName(profiles: NoteRow['profiles'], fallback: string | null) {
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  return profile?.full_name || profile?.email || fallback || "Unknown";
}

export default function NotesLog({ entityType, entityId, onNextStepSaved }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [body, setBody] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showNextStep = canSyncNextStep(entityType);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('id, body, next_step, created_at, created_by, profiles(full_name, email)')
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
    if (!trimmedBody && !trimmedNextStep) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('notes').insert({
        entity_type: entityType,
        entity_id: entityId,
        body: trimmedBody || "(no note text)",
        next_step: trimmedNextStep || null,
        created_by: user?.id || null,
      });

      if (error) throw error;

      if (trimmedNextStep && canSyncNextStep(entityType)) {
        const { error: parentError } = await supabase
          .from(nextStepParentTables[entityType])
          .update({ next_step: trimmedNextStep })
          .eq('id', entityId);

        if (parentError) throw parentError;
        onNextStepSaved?.(trimmedNextStep);
      }

      setBody("");
      setNextStep("");
      await fetchNotes();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error adding note");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = body.trim().length > 0 || (showNextStep && nextStep.trim().length > 0);

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddNote} className="space-y-3">
        <textarea
          className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-y text-sm"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Add a note..."
        />
        {showNextStep ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Next Step</label>
            <input
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={nextStep}
              onChange={e => setNextStep(e.target.value)}
              placeholder="Optional next step..."
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
