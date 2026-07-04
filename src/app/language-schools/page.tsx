"use client";

import {
  SchoolStatusSelect,
  type SchoolStatus,
} from "@/components/SchoolStatusSelect";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Filter, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LanguageSchool {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  source: string | null;
  status: SchoolStatus;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  next_step: string | null;
  notes: string | null;
  assigned_staff_id: string | null;
  created_at: string;
  updated_at: string;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default function LanguageSchoolsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [schools, setSchools] = useState<LanguageSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchSchools() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("language_schools")
          .select("*")
          .order("name");

        if (error) throw error;
        setSchools((data || []) as LanguageSchool[]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchSchools();
  }, [supabase]);

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.contact_person
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      school.city?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const today = new Date().toISOString().split("T")[0];
  const acquisitionSignal = schools.filter(
    (school) => school.status === "Interested" || school.status === "Follow-up",
  ).length;
  const followUpsRequired = schools.filter(
    (school) =>
      school.next_follow_up_date && school.next_follow_up_date <= today,
  ).length;

  const metrics = [
    {
      label: "Total Schools",
      value: schools.length.toLocaleString(),
      detail: "Language school leads",
    },
    {
      label: "Interested / Follow-up",
      value: acquisitionSignal.toLocaleString(),
      detail: "Active acquisition signal",
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
            Outreach Pipeline
          </p>
          <div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Language Schools
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Track schools receiving Tropinka outreach.
            </p>
          </div>
        </div>
        <Button
          type="button"
          icon={Plus}
          onClick={() => {
            window.location.href = "/language-schools/new";
          }}
        >
          Add School
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-md md:grid-cols-3">
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
            placeholder="Search schools..."
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
          <p className="mt-4 text-on-surface-variant">
            Loading language schools...
          </p>
        </Card>
      ) : error ? (
        <Card className="border-red-100 bg-red-50 p-8 text-center">
          <p className="text-red-600">
            Error loading language schools: {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-bold text-red-700 underline"
          >
            Try again
          </button>
        </Card>
      ) : filteredSchools.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <p className="text-on-surface-variant">No language schools found.</p>
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
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-outline-variant/15 bg-surface-container-low text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Next Follow-up</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => (
                  <tr
                    key={school.id}
                    className="border-t border-outline-variant/10 transition-colors hover:bg-primary-container/5"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          href={`/language-schools/${school.id}`}
                          className="font-bold text-on-surface hover:text-primary"
                        >
                          {school.name}
                        </Link>
                        <p className="text-xs text-on-surface-variant">
                          {[school.city, school.state]
                            .filter(Boolean)
                            .join(", ") || "No location listed"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface">
                      {school.contact_person || "Not listed"}
                    </td>
                    <td className="px-6 py-4">
                      <SchoolStatusSelect
                        id={school.id}
                        value={school.status}
                        onSaved={(status) =>
                          setSchools((prev) =>
                            prev.map((row) =>
                              row.id === school.id ? { ...row, status } : row,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-on-surface">
                      {formatDate(school.next_follow_up_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/language-schools/${school.id}`}
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
