"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Filter, HandHeart, Loader2, Mail, Phone, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

type Volunteer = Database["public"]["Tables"]["volunteers"]["Row"];
type StatusFilter = "Active" | "Inactive" | "All";

const statusFilters: StatusFilter[] = ["Active", "Inactive", "All"];

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function fetchVolunteers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("volunteers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setVolunteers((data || []) as Volunteer[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVolunteers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleVolunteers = volunteers.filter((volunteer) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Active") return volunteer.is_active;
    return !volunteer.is_active;
  });

  return (
    <div className="space-y-stack-lg">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
            Roster
          </p>
          <div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Volunteers
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Who helps out, how to reach them, and what they help with.
            </p>
          </div>
        </div>
        <Button
          type="button"
          icon={Plus}
          onClick={() => {
            window.location.href = "/volunteers/new";
          }}
        >
          Add Volunteer
        </Button>
      </section>

      <section className="flex items-center gap-2">
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
      </section>

      {loading ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-on-surface-variant">Loading volunteers...</p>
        </Card>
      ) : error ? (
        <Card className="border-red-100 bg-red-50 p-8 text-center">
          <p className="text-red-600">Error loading volunteers: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-bold text-red-700 underline"
          >
            Try again
          </button>
        </Card>
      ) : visibleVolunteers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <HandHeart className="h-8 w-8 text-on-surface-variant/50" />
          <p className="mt-4 text-on-surface-variant">No volunteers found.</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-outline-variant/15 bg-surface-container-low text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Helps With</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleVolunteers.map((volunteer) => (
                  <tr
                    key={volunteer.id}
                    className="border-t border-outline-variant/10 transition-colors hover:bg-primary-container/5"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/volunteers/${volunteer.id}/edit`}
                        className="font-bold text-on-surface hover:text-primary"
                      >
                        {volunteer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-on-surface-variant">
                        {volunteer.email ? (
                          <span className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            {volunteer.email}
                          </span>
                        ) : null}
                        {volunteer.phone ? (
                          <span className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            {volunteer.phone}
                          </span>
                        ) : null}
                        {!volunteer.email && !volunteer.phone ? "—" : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {volunteer.helps_with || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={volunteer.is_active ? "success" : "neutral"}>
                        {volunteer.is_active ? "Active" : "Inactive"}
                      </Badge>
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
