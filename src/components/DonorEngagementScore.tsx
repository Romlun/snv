"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EngagementScoreRing } from "@/components/EngagementScoreRing";
import { Portal } from "@/components/ui/Portal";

interface DonorEngagementScoreProps {
  donorId: string;
  score: number;
}

interface EngagementScoreBreakdown {
  total: number;
  contact: {
    points: number;
    max: number;
    last_contact_date: string | null;
    days_since: number | null;
  };
  giving: {
    points: number;
    max: number;
    last_gift_date: string | null;
    days_since: number | null;
  };
  recurring: {
    points: number;
    max: number;
    is_recurring: boolean;
  };
  follow_up: {
    points: number;
    max: number;
    next_follow_up_date: string | null;
    days_overdue: number | null;
  };
}

function pluralizeDays(days: number) {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function recencyFact(prefix: string, date: string | null, daysSince: number | null, empty: string) {
  if (!date || daysSince === null) return empty;
  if (daysSince === 0) return `${prefix} today`;
  return `${prefix} ${pluralizeDays(daysSince)} ago`;
}

function followUpFact(date: string | null, daysOverdue: number | null) {
  if (!date) return "Not scheduled";
  if (daysOverdue !== null && daysOverdue > 0) return `${pluralizeDays(daysOverdue)} overdue`;
  if (daysOverdue === 0) return "Due today";
  return `Scheduled ${formatDate(date)}`;
}

export function DonorEngagementScore({ donorId, score }: DonorEngagementScoreProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<EngagementScoreBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleOpen() {
    setOpen(true);
    if (breakdown || loading) return;

    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("get_engagement_score_breakdown", {
      p_donor_id: donorId,
    });

    setLoading(false);

    if (rpcError) {
      console.error(rpcError);
      setError("Could not load engagement breakdown.");
      return;
    }

    setBreakdown(data as EngagementScoreBreakdown);
  }

  const rows = breakdown
    ? [
        {
          label: "Contact",
          points: breakdown.contact.points,
          max: breakdown.contact.max,
          fact: recencyFact(
            "Contacted",
            breakdown.contact.last_contact_date,
            breakdown.contact.days_since,
            "No contact recorded",
          ),
        },
        {
          label: "Giving",
          points: breakdown.giving.points,
          max: breakdown.giving.max,
          fact: recencyFact(
            "Last gift",
            breakdown.giving.last_gift_date,
            breakdown.giving.days_since,
            "No gifts recorded",
          ),
        },
        {
          label: "Recurring",
          points: breakdown.recurring.points,
          max: breakdown.recurring.max,
          fact: breakdown.recurring.is_recurring ? "Recurring donor" : "Not recurring",
        },
        {
          label: "Follow-up",
          points: breakdown.follow_up.points,
          max: breakdown.follow_up.max,
          fact: followUpFact(
            breakdown.follow_up.next_follow_up_date,
            breakdown.follow_up.days_overdue,
          ),
        },
      ]
    : [];

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex rounded-full outline-none transition-transform hover:scale-105 focus:ring-2 focus:ring-blue-500"
        aria-label="Show engagement score breakdown"
      >
        <EngagementScoreRing score={score} />
      </button>

      {open ? (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-sm rounded-xl border bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b px-4 py-3 dark:border-zinc-800">
                <div>
                  <h2 className="font-semibold">Engagement Score</h2>
                  <p className="text-xs text-zinc-500">{breakdown?.total ?? score}/100 total</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label="Close engagement score breakdown"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading breakdown...
                  </div>
                ) : error ? (
                  <p className="py-6 text-center text-sm text-red-600">{error}</p>
                ) : (
                  <div className="space-y-3">
                    {rows.map(row => (
                      <div key={row.label} className="flex items-start justify-between gap-4 rounded-lg border p-3 dark:border-zinc-800">
                        <div>
                          <p className="text-sm font-semibold">{row.label}</p>
                          <p className="text-xs text-zinc-500">{row.fact}</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {row.points}/{row.max}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      ) : null}
    </>
  );
}
