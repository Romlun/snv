"use client";

import { ChurchEngagementScore } from "@/components/ChurchEngagementScore";
import { RelationshipStatusSelect } from "@/components/RelationshipStatusSelect";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { Filter, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Church = Database["public"]["Tables"]["churches"]["Row"];

function formatAverageScore(churches: Church[]) {
  if (churches.length === 0) return "0";

  const total = churches.reduce(
    (sum, church) => sum + Number(church.engagement_score || 0),
    0,
  );

  return Math.round(total / churches.length).toString();
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default function ChurchesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchChurches() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("churches")
          .select("*")
          .order("name");

        if (error) throw error;
        setChurches(data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchChurches();
  }, [supabase]);

  const filteredChurches = churches.filter(
    (church) =>
      church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.pastor?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const today = new Date().toISOString().split("T")[0];
  const followUpsRequired = churches.filter(
    (church) => church.next_visit_date && church.next_visit_date <= today,
  ).length;

  const metrics = [
    {
      label: "Total Churches",
      value: churches.length.toLocaleString(),
      detail: "Partner congregations",
    },
    {
      label: "Avg. Engagement Score",
      value: `${formatAverageScore(churches)}/100`,
      detail: "Across fetched churches",
    },
    {
      label: "Follow-ups Required",
      value: followUpsRequired.toLocaleString(),
      detail: "Next visits due",
    },
  ];

  return (
    <div className="space-y-stack-lg">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
            Church Partnerships
          </p>
          <div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Churches
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Manage relationships with church partners.
            </p>
          </div>
        </div>
        <Button
          type="button"
          icon={Plus}
          onClick={() => {
            window.location.href = "/churches/new";
          }}
        >
          Add Church
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-cs-md md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} padding="md" className="space-y-3">
            <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              {metric.label}
            </span>
            <p className="font-headline text-headline-md font-bold tabular-nums text-on-surface">
              {metric.value}
            </p>
            <p className="text-sm text-on-surface-variant">{metric.detail}</p>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
          <Input
            variant="search"
            placeholder="Search churches..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-11"
          />
        </div>
        <Button type="button" variant="secondary" icon={Filter}>
          Filters
        </Button>
      </section>

      {loading ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-on-surface-variant">Loading churches...</p>
        </Card>
      ) : error ? (
        <Card className="border-red-100 bg-red-50 p-8 text-center">
          <p className="text-red-600">Error loading churches: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-bold text-red-700 underline"
          >
            Try again
          </button>
        </Card>
      ) : filteredChurches.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <p className="text-on-surface-variant">No churches found.</p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-sm font-semibold text-primary hover:underline"
            >
              Clear search
            </button>
          ) : null}
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-outline-variant/15 bg-surface-container-low text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Pastor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4">Next Visit</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredChurches.map((church) => (
                  <tr
                    key={church.id}
                    className="border-t border-outline-variant/10 transition-colors hover:bg-primary-container/5"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          href={`/churches/${church.id}`}
                          className="font-bold text-on-surface hover:text-primary"
                        >
                          {church.name}
                        </Link>
                        <p className="text-xs text-on-surface-variant">
                          {church.denomination || "No denomination listed"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface">
                      {church.pastor || "Not listed"}
                    </td>
                    <td className="px-6 py-4">
                      <RelationshipStatusSelect
                        id={church.id}
                        table="churches"
                        value={church.relationship_status ?? "Steady"}
                        onSaved={(relationship_status) =>
                          setChurches((prev) =>
                            prev.map((row) =>
                              row.id === church.id
                                ? { ...row, relationship_status }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ChurchEngagementScore
                        churchId={church.id}
                        score={church.engagement_score ?? 0}
                      />
                    </td>
                    <td className="px-6 py-4 text-on-surface">
                      {formatDate(church.next_visit_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/churches/${church.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
