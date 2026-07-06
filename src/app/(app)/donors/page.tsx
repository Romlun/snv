"use client";

import { DonorEngagementScore } from "@/components/DonorEngagementScore";
import { RelationshipStatusSelect } from "@/components/RelationshipStatusSelect";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { Filter, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Donor = Database["public"]["Tables"]["donors"]["Row"];

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatAverageScore(donors: Donor[]) {
  if (donors.length === 0) return "0";

  const total = donors.reduce(
    (sum, donor) => sum + Number(donor.engagement_score || 0),
    0,
  );

  return Math.round(total / donors.length).toString();
}

export default function DonorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchDonors() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("donors")
          .select("*")
          .order("name");

        if (error) throw error;
        setDonors(data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchDonors();
  }, [supabase]);

  const filteredDonors = donors.filter(
    (donor) =>
      donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const today = new Date().toISOString().split("T")[0];
  const followUpsRequired = donors.filter(
    (donor) =>
      donor.next_follow_up_date && donor.next_follow_up_date <= today,
  ).length;

  const metrics = [
    {
      label: "Total Donors",
      value: donors.length.toLocaleString(),
      detail: "Supporter relationships",
    },
    {
      label: "Avg. Engagement Score",
      value: `${formatAverageScore(donors)}/100`,
      detail: "Across fetched donors",
    },
    {
      label: "Follow-ups Required",
      value: followUpsRequired.toLocaleString(),
      detail: "Due today or overdue",
    },
  ];

  return (
    <div className="space-y-stack-lg">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
            Donor Registry
          </p>
          <div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Donors
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Manage relationships with supporters.
            </p>
          </div>
        </div>
        <Button
          type="button"
          icon={Plus}
          onClick={() => {
            window.location.href = "/donors/new";
          }}
        >
          Add Donor
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
            placeholder="Search donors..."
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
          <p className="mt-4 text-on-surface-variant">Loading donors...</p>
        </Card>
      ) : error ? (
        <Card className="border-red-100 bg-red-50 p-8 text-center">
          <p className="text-red-600">Error loading donors: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-bold text-red-700 underline"
          >
            Try again
          </button>
        </Card>
      ) : filteredDonors.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <p className="text-on-surface-variant">No donors found.</p>
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
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-outline-variant/15 bg-surface-container-low text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-right">Lifetime Giving</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonors.map((donor) => (
                  <tr
                    key={donor.id}
                    className="border-t border-outline-variant/10 transition-colors hover:bg-primary-container/5"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          href={`/donors/${donor.id}`}
                          className="font-bold text-on-surface hover:text-primary"
                        >
                          {donor.name}
                        </Link>
                        <p className="text-xs text-on-surface-variant">
                          {donor.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RelationshipStatusSelect
                        id={donor.id}
                        table="donors"
                        value={donor.relationship_status}
                        onSaved={(relationship_status) =>
                          setDonors((prev) =>
                            prev.map((row) =>
                              row.id === donor.id
                                ? { ...row, relationship_status }
                                : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <DonorEngagementScore
                        donorId={donor.id}
                        score={donor.engagement_score}
                      />
                    </td>
                    <td className="px-6 py-4 text-right font-semibold tabular-nums text-on-surface">
                      {formatCurrency(Number(donor.lifetime_giving || 0))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/donors/${donor.id}`}
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
