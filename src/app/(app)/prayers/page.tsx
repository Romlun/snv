"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { Check, Filter, HeartHandshake, Loader2 } from "lucide-react";

type PrayerRequest = Database["public"]["Tables"]["prayer_requests"]["Row"];
type EntityType = "donor" | "church" | "language_school";

interface EntityRef {
  id: string;
  name: string;
  type: EntityType;
  is_prayer_partner?: boolean;
}

type StatusFilter = "Active" | "Answered" | "All";

const statusFilters: StatusFilter[] = ["Active", "Answered", "All"];

const entityTypeLabel: Record<EntityType, string> = {
  donor: "Donor",
  church: "Church",
  language_school: "Language School",
};

function entityHref(type: string, id: string) {
  if (type === "church") return `/churches/${id}`;
  if (type === "language_school") return `/language-schools/${id}`;
  return `/donors/${id}`;
}

function formatRequestDate(value: string | null) {
  if (!value) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function PrayersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [entitiesById, setEntitiesById] = useState<Map<string, EntityRef>>(
    new Map(),
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active");
  const [prayerPartnersOnly, setPrayerPartnersOnly] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answeredNote, setAnsweredNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [requestsResult, donorsResult, churchesResult, schoolsResult] =
        await Promise.all([
          supabase
            .from("prayer_requests")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("donors").select("id, name, is_prayer_partner"),
          supabase.from("churches").select("id, name"),
          supabase.from("language_schools").select("id, name"),
        ]);

      if (requestsResult.error) throw requestsResult.error;
      if (donorsResult.error) throw donorsResult.error;
      if (churchesResult.error) throw churchesResult.error;
      if (schoolsResult.error) throw schoolsResult.error;

      const donors = (donorsResult.data || []) as {
        id: string;
        name: string;
        is_prayer_partner: boolean;
      }[];
      const churches = (churchesResult.data || []) as {
        id: string;
        name: string;
      }[];
      const schools = (schoolsResult.data || []) as {
        id: string;
        name: string;
      }[];

      const entities = new Map<string, EntityRef>();
      donors.forEach((donor) =>
        entities.set(donor.id, {
          id: donor.id,
          name: donor.name,
          type: "donor",
          is_prayer_partner: donor.is_prayer_partner,
        }),
      );
      churches.forEach((church) =>
        entities.set(church.id, {
          id: church.id,
          name: church.name,
          type: "church",
        }),
      );
      schools.forEach((school) =>
        entities.set(school.id, {
          id: school.id,
          name: school.name,
          type: "language_school",
        }),
      );

      setEntitiesById(entities);
      setRequests((requestsResult.data || []) as PrayerRequest[]);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error loading prayer requests",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

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
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error updating prayer request",
      );
    } finally {
      setSavingAnswer(false);
    }
  }

  const visibleRequests = requests.filter((request) => {
    if (statusFilter === "Active" && request.is_answered) return false;
    if (statusFilter === "Answered" && !request.is_answered) return false;
    if (prayerPartnersOnly && request.entity_type === "donor") {
      const donor = entitiesById.get(request.entity_id);
      if (!donor?.is_prayer_partner) return false;
    }
    return true;
  });

  const emptyStateCopy =
    statusFilter === "Answered"
      ? "No answered prayer requests."
      : statusFilter === "All"
        ? "No prayer requests found."
        : "No active prayer requests.";

  return (
    <div className="space-y-stack-lg">
      <section className="space-y-2">
        <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
          Prayer List
        </p>
        <div>
          <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
            Prayers
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Every prayer request in one list, ready to pray through.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-on-surface-variant/70" />
          <select
            className="focus-ring rounded-lg border border-outline-variant/20 bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus-visible:border-primary"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            {statusFilters.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-on-surface">
          <input
            type="checkbox"
            className="focus-ring h-4 w-4 rounded border-outline-variant/40 text-primary"
            checked={prayerPartnersOnly}
            onChange={(event) => setPrayerPartnersOnly(event.target.checked)}
          />
          Prayer partners only
        </label>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-on-surface-variant">
            Loading prayer requests...
          </p>
        </Card>
      ) : visibleRequests.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <HeartHandshake className="h-8 w-8 text-on-surface-variant/50" />
          <p className="mt-4 text-on-surface-variant">{emptyStateCopy}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleRequests.map((request) => {
            const entity = entitiesById.get(request.entity_id);

            return (
              <Card
                key={request.id}
                padding="none"
                className={
                  request.is_answered
                    ? "overflow-hidden bg-surface-container-low/70"
                    : "overflow-hidden"
                }
              >
                <Card.Body className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {request.is_answered ? (
                          <Badge variant="success">Answered</Badge>
                        ) : (
                          <Badge variant="neutral">Praying</Badge>
                        )}
                        <Link
                          href={entityHref(
                            request.entity_type,
                            request.entity_id,
                          )}
                          className="font-bold text-on-surface hover:text-primary"
                        >
                          {entity?.name ?? "Unknown"}
                        </Link>
                        {request.entity_type !== "donor" ? (
                          <Badge variant="info">
                            {entityTypeLabel[
                              request.entity_type as EntityType
                            ] ?? request.entity_type}
                          </Badge>
                        ) : null}
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
                    <div className="space-y-3 rounded-lg border border-outline-variant/15 bg-surface/70 p-3">
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
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
