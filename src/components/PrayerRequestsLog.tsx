"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { Check, HeartHandshake, Loader2, Plus } from "lucide-react";

type EntityType = "donor" | "church" | "language_school";
type PrayerRequest =
  Database["public"]["Tables"]["prayer_requests"]["Row"];

interface PrayerRequestsLogProps {
  entityType: EntityType;
  entityId: string;
}

function formatRequestDate(value: string | null) {
  if (!value) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function PrayerRequestsLog({
  entityType,
  entityId,
}: PrayerRequestsLogProps) {
  const supabase = useMemo(() => createClient(), []);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [requestText, setRequestText] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answeredNote, setAnsweredNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("prayer_requests")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setRequests((data || []) as PrayerRequest[]);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error loading prayer requests",
      );
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRequests();
  }, [fetchRequests]);

  async function handleAddRequest(event: React.FormEvent) {
    event.preventDefault();
    const trimmedRequest = requestText.trim();
    if (!trimmedRequest) return;

    try {
      setSaving(true);
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not signed in");

      const { error: insertError } = await supabase
        .from("prayer_requests")
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          request_text: trimmedRequest,
          created_by: user.id,
        });

      if (insertError) throw insertError;

      setRequestText("");
      await fetchRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error adding prayer request",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkAnswered(requestId: string) {
    try {
      setSavingAnswer(true);
      setError(null);
      const trimmedNote = answeredNote.trim();
      const { error: updateError } = await supabase
        .from("prayer_requests")
        .update({
          is_answered: true,
          answered_note: trimmedNote || null,
          answered_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      setAnsweringId(null);
      setAnsweredNote("");
      await fetchRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error updating prayer request",
      );
    } finally {
      setSavingAnswer(false);
    }
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <Card.Header>
        <div>
          <h2 className="font-headline text-headline-md text-on-surface">
            Prayer Requests
          </h2>
          <p className="text-sm text-on-surface-variant">
            Record requests and remember answered prayers.
          </p>
        </div>
        <HeartHandshake className="h-5 w-5 text-primary" />
      </Card.Header>
      <Card.Body className="space-y-6">
        <form onSubmit={handleAddRequest} className="space-y-3">
          <div className="space-y-2">
            <label
              htmlFor={`prayer-request-${entityId}`}
              className="text-sm font-semibold text-on-surface"
            >
              New prayer request
            </label>
            <Textarea
              id={`prayer-request-${entityId}`}
              required
              rows={3}
              variant="box"
              value={requestText}
              onChange={(event) => setRequestText(event.target.value)}
              placeholder="What would you like the team to pray for?"
            />
          </div>
          <Button type="submit" size="sm" icon={Plus} disabled={saving}>
            {saving ? "Adding..." : "Add Request"}
          </Button>
        </form>

        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <p className="py-4 text-center text-sm text-on-surface-variant">
            No prayer requests recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <article
                key={request.id}
                className={
                  request.is_answered
                    ? "rounded-xl border border-outline-variant/10 bg-surface-container-low/70 p-4"
                    : "rounded-xl border border-outline-variant/15 bg-white/40 p-4"
                }
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {request.is_answered ? (
                        <Badge variant="success">Answered</Badge>
                      ) : (
                        <Badge variant="neutral">Praying</Badge>
                      )}
                      <time
                        dateTime={request.created_at || undefined}
                        className="text-xs text-on-surface-variant"
                      >
                        Added {formatRequestDate(request.created_at)}
                      </time>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-on-surface">
                      {request.request_text}
                    </p>
                    {request.is_answered && request.answered_note ? (
                      <div className="mt-3 rounded-lg border border-green-200/60 bg-green-50/70 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
                          Answer note
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-green-900">
                          {request.answered_note}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {!request.is_answered && answeringId !== request.id ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={Check}
                      className="shrink-0"
                      onClick={() => {
                        setAnsweringId(request.id);
                        setAnsweredNote("");
                      }}
                    >
                      Mark answered
                    </Button>
                  ) : null}
                </div>

                {!request.is_answered && answeringId === request.id ? (
                  <div className="mt-4 space-y-3 rounded-lg border border-outline-variant/15 bg-surface/70 p-3">
                    <div className="space-y-2">
                      <label
                        htmlFor={`answered-note-${request.id}`}
                        className="text-sm font-semibold text-on-surface"
                      >
                        Answer note (optional)
                      </label>
                      <Input
                        id={`answered-note-${request.id}`}
                        variant="box"
                        value={answeredNote}
                        onChange={(event) =>
                          setAnsweredNote(event.target.value)
                        }
                        placeholder="How was this prayer answered?"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        icon={Check}
                        disabled={savingAnswer}
                        onClick={() => void handleMarkAnswered(request.id)}
                      >
                        {savingAnswer ? "Saving..." : "Save as Answered"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="tertiary"
                        disabled={savingAnswer}
                        onClick={() => {
                          setAnsweringId(null);
                          setAnsweredNote("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
