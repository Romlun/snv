"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EntityType = 'task' | 'donor' | 'church' | 'project';

interface Props {
  entityType: EntityType;
  entityId: string;
}

interface ProfileJoin {
  full_name: string | null;
  email: string | null;
}

interface NoteRow {
  id: string;
  body: string;
  created_at: string;
  created_by: string | null;
  profiles: ProfileJoin | ProfileJoin[] | null;
}

function getAuthorName(profiles: NoteRow['profiles'], fallback: string | null) {
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  return profile?.full_name || profile?.email || fallback || "Unknown";
}

export default function NotesLog({ entityType, entityId }: Props) {
  const supabase = createClient();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchNotes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('id, body, created_at, created_by, profiles(full_name, email)')
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
  }

  useEffect(() => {
    fetchNotes();
  }, [entityType, entityId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('notes').insert({
        entity_type: entityType,
        entity_id: entityId,
        body: trimmed,
        created_by: user?.id || null,
      });

      if (error) throw error;
      setBody("");
      await fetchNotes();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error adding note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddNote} className="space-y-3">
        <textarea
          className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-y text-sm"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Add a note..."
        />
        <button
          type="submit"
          disabled={saving || !body.trim()}
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
