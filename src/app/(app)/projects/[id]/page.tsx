"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import DateField from "@/components/DateField";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Tags,
  Target,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type ProjectStatus = 'Idea' | 'Planning' | 'Active' | 'Waiting' | 'Completed' | 'Cancelled';
type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

interface Project {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  goal_description: string | null;
  budget_needed: number;
  current_funding: number;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface AssignedStaff {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

interface BudgetEntry {
  id: string;
  project_id: string | null;
  category: string;
  name: string;
  needed: number;
  raised: number;
  is_project_based: boolean;
  created_at: string;
  updated_at: string;
}

interface Donor {
  id: string;
  name: string;
}

interface GiftProfile {
  name: string | null;
}

interface GiftContributionRow {
  id: string;
  amount: number;
  gift_date: string;
  notes: string | null;
  method: string | null;
  donor_id: string | null;
  donors: GiftProfile | GiftProfile[] | null;
}

interface Contribution {
  id: string;
  amount: number;
  gift_date: string;
  notes: string | null;
  method: string | null;
  donorName: string | null;
}

interface AddFundsFormData {
  amount: string;
  donor_id: string;
  gift_date: string;
  method: string;
  notes: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_BADGE_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  Idea: "neutral",
  Planning: "info",
  Active: "success",
  Waiting: "warning",
  Completed: "primary",
  Cancelled: "error",
};

function getFundingPercent(project: Project) {
  if (!project.budget_needed) return 0;
  return Math.min(100, Math.round((project.current_funding / project.budget_needed) * 100));
}

function todayDateInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function validDateOrNull(value: string) {
  if (!DATE_RE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : null;
}

function getDonorName(donors: GiftContributionRow['donors']) {
  const donor = Array.isArray(donors) ? donors[0] : donors;
  return donor?.name || null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(value: string | null | undefined, fallback = "Not set") {
  if (!value) return fallback;
  const date = DATE_RE.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value: number | null | undefined) {
  return Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function daysActive(project: Project) {
  const raw = project.start_date || project.created_at;
  const start = DATE_RE.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
  if (Number.isNaN(start.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [assignedStaff, setAssignedStaff] = useState<AssignedStaff[]>([]);
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addingFunds, setAddingFunds] = useState(false);
  const [fundForm, setFundForm] = useState<AddFundsFormData>({
    amount: "",
    donor_id: "",
    gift_date: todayDateInputValue(),
    method: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function fetchProjectData(showPageLoading = false) {
    try {
      if (showPageLoading) {
        setLoading(true);
      }
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      const { data: staffData } = await supabase
        .from('project_staff')
        .select('staff_id, profiles(full_name, email, avatar_url)')
        .eq('project_id', id);
      setAssignedStaff((staffData || []).map(row => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
          id: row.staff_id,
          name: profile?.full_name || profile?.email || row.staff_id,
          email: profile?.email || null,
          avatarUrl: profile?.avatar_url || null,
        };
      }));

      const { data: budgetData } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('project_id', id)
        .order('category');
      setBudgetEntries((budgetData || []) as BudgetEntry[]);

      const { data: donorData } = await supabase
        .from('donors')
        .select('id, name')
        .order('name');
      setDonors((donorData || []) as Donor[]);

      const { data: giftData } = await supabase
        .from('gifts')
        .select('id, amount, gift_date, notes, method, donor_id, donors(name)')
        .eq('project_id', id)
        .order('gift_date', { ascending: false });
      setContributions(((giftData || []) as GiftContributionRow[]).map(gift => ({
        id: gift.id,
        amount: gift.amount,
        gift_date: gift.gift_date,
        notes: gift.notes,
        method: gift.method,
        donorName: getDonorName(gift.donors),
      })));

    } catch (err) {
      console.error(err);
    } finally {
      if (showPageLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchProjectData(true);
  }, [id]);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingFunds(true);

    try {
      const amount = Number(fundForm.amount);
      if (!amount || amount <= 0) {
        throw new Error("Enter a valid amount");
      }

      const giftDate = validDateOrNull(fundForm.gift_date);
      const { error } = await supabase.from('gifts').insert({
        project_id: id,
        amount,
        donor_id: fundForm.donor_id || null,
        gift_date: giftDate || undefined,
        method: fundForm.method || null,
        notes: fundForm.notes || null,
      });

      if (error) throw error;

      await fetchProjectData();
      setFundForm({
        amount: "",
        donor_id: "",
        gift_date: todayDateInputValue(),
        method: "",
        notes: "",
      });
      setShowAddFunds(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error adding funds");
    } finally {
      setAddingFunds(false);
    }
  };

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-on-surface-variant">Loading project details...</p>
      </Card>
    );
  }

  if (!project) {
    notFound();
  }

  const fundingPercent = getFundingPercent(project);

  return (
    <div className="space-y-gutter">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <section className="glass-card overflow-hidden p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-container/15 font-headline text-headline-lg font-semibold text-primary">
              {getInitials(project.name)}
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={STATUS_BADGE_VARIANT[project.status]}>{project.status}</Badge>
                  {project.tags && project.tags.length > 0
                    ? project.tags.map(tag => (
                        <Badge key={tag} variant="neutral">{tag}</Badge>
                      ))
                    : null}
                </div>
                <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
                  {project.name}
                </h1>
                <p className="text-sm text-on-surface-variant">
                  Started {formatDate(project.start_date, "Not scheduled")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  icon={Plus}
                  onClick={() => setShowAddFunds(value => !value)}
                >
                  Add Funds
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon={Pencil}
                  onClick={() => {
                    window.location.href = `/projects/${project.id}/edit`;
                  }}
                >
                  Edit Project
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-cs-md md:grid-cols-3">
        <Card padding="md" className="space-y-3">
          <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Total Funding
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-headline-md font-bold tabular-nums text-primary">
              {formatMoney(project.current_funding)}
            </span>
            <span className="text-sm text-on-surface-variant">
              / {formatMoney(project.budget_needed)} goal
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-primary-container"
              style={{ width: `${fundingPercent}%` }}
            />
          </div>
        </Card>
        <Card padding="md" className="space-y-3">
          <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Days Active
          </span>
          <p className="font-headline text-headline-md font-bold tabular-nums text-on-surface">
            {daysActive(project)}
          </p>
          <p className="text-sm text-on-surface-variant">days since start</p>
        </Card>
        <Card padding="md" className="space-y-3">
          <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Contributions
          </span>
          <p className="font-headline text-headline-md font-bold tabular-nums text-on-surface">
            {contributions.length}
          </p>
          <p className="text-sm text-on-surface-variant">gifts recorded</p>
        </Card>
      </section>

      {showAddFunds ? (
        <Card>
          <h2 className="mb-4 font-headline text-headline-md text-on-surface">
            Add Funds
          </h2>
          <form onSubmit={handleAddFunds} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Amount</label>
              <Input
                required
                variant="box"
                type="number"
                min="0.01"
                step="0.01"
                value={fundForm.amount}
                onChange={e => setFundForm({ ...fundForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Donor</label>
              <Select
                variant="box"
                value={fundForm.donor_id}
                onChange={e => setFundForm({ ...fundForm, donor_id: e.target.value })}
              >
                <option value="">No donor selected</option>
                {donors.map(donor => (
                  <option key={donor.id} value={donor.id}>{donor.name}</option>
                ))}
              </Select>
            </div>
            <DateField
              label="Gift Date"
              value={fundForm.gift_date}
              onChange={val => setFundForm({ ...fundForm, gift_date: val })}
            />
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Method</label>
              <Input
                variant="box"
                placeholder="cash, check, card, online"
                value={fundForm.method}
                onChange={e => setFundForm({ ...fundForm, method: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-on-surface">Note</label>
              <Textarea
                variant="box"
                value={fundForm.notes}
                onChange={e => setFundForm({ ...fundForm, notes: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
              <Button type="submit" disabled={addingFunds}>
                {addingFunds ? "Adding..." : "Save Funds"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAddFunds(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <aside className="space-y-gutter lg:col-span-1">
          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Project Details
            </h2>
            <div className="space-y-4">
              <DetailRow icon={Calendar} label="Start Date" value={formatDate(project.start_date)} />
              <DetailRow icon={Calendar} label="End Date" value={formatDate(project.end_date)} />
              <DetailRow icon={DollarSign} label="Budget Needed" value={formatMoney(project.budget_needed)} />
              <DetailRow
                icon={Tags}
                label="Tags"
                value={project.tags && project.tags.length > 0 ? project.tags.join(", ") : "No tags"}
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Assigned Staff
            </h2>
            {assignedStaff.length > 0 ? (
              <div className="space-y-4">
                {assignedStaff.map((person, index) => (
                  <div
                    key={person.id}
                    className={
                      index < assignedStaff.length - 1
                        ? "flex items-center gap-3 border-b border-outline-variant/15 pb-4"
                        : "flex items-center gap-3"
                    }
                  >
                    {person.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.avatarUrl}
                        alt={person.name}
                        className="h-12 w-12 shrink-0 rounded-full border border-outline-variant object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container/15 font-headline text-sm font-semibold text-primary">
                        {getInitials(person.name)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-on-surface">{person.name}</p>
                      {person.email ? (
                        <p className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                          <Mail className="h-3.5 w-3.5" />
                          {person.email}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">No staff assigned yet.</p>
            )}
          </Card>

          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Internal Details
            </h2>
            <div className="space-y-5">
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Created
                </p>
                <p className="text-sm font-semibold text-on-surface">
                  {new Date(project.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Updated
                </p>
                <p className="text-sm font-semibold text-on-surface">
                  {new Date(project.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </aside>

        <main className="space-y-gutter lg:col-span-2">
          <Card className="border-l-4 border-l-primary">
            <h2 className="mb-4 flex items-center gap-2 font-headline text-headline-md text-on-surface">
              <FileText className="h-4 w-4 text-primary" />
              Description
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant first-letter:float-left first-letter:mr-2 first-letter:font-headline first-letter:text-4xl first-letter:font-semibold first-letter:text-primary">
              {project.description || "No description yet."}
            </p>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <h2 className="mb-4 flex items-center gap-2 font-headline text-headline-md text-on-surface">
              <Target className="h-4 w-4 text-primary" />
              Goal
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant first-letter:float-left first-letter:mr-2 first-letter:font-headline first-letter:text-4xl first-letter:font-semibold first-letter:text-primary">
              {project.goal_description || "No goal description yet."}
            </p>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <Card.Header>
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Contributions
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Gifts recorded toward this project.
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-primary" />
            </Card.Header>
            <Card.Body>
              {contributions.length > 0 ? (
                <div className="space-y-3">
                  {contributions.map(gift => (
                    <div
                      key={gift.id}
                      className="flex flex-col gap-3 rounded-xl border border-outline-variant/15 bg-white/40 p-4 transition-colors hover:bg-primary-container/5 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-on-surface">{gift.donorName || "No donor selected"}</p>
                        <p className="text-xs text-on-surface-variant">
                          {formatDate(gift.gift_date)}
                          {gift.method ? ` • ${gift.method}` : ""}
                        </p>
                        {gift.notes ? <p className="mt-2 text-sm text-on-surface-variant">{gift.notes}</p> : null}
                      </div>
                      <p className="text-sm font-bold tabular-nums text-primary">{formatMoney(gift.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-on-surface-variant">
                  No contributions recorded yet.
                </div>
              )}
            </Card.Body>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <Card.Header>
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Linked Budget Entries
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Budget categories funded by this project.
                </p>
              </div>
            </Card.Header>
            <Card.Body>
              {budgetEntries.length > 0 ? (
                <div className="space-y-3">
                  {budgetEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-outline-variant/15 bg-white/40 p-4"
                    >
                      <div>
                        <p className="font-semibold text-on-surface">{entry.name}</p>
                        <p className="text-xs text-on-surface-variant">{entry.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums text-primary">{formatMoney(entry.raised)} raised</p>
                        <p className="text-xs text-on-surface-variant">of {formatMoney(entry.needed)} needed</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-on-surface-variant">
                  No budget entries linked yet.
                </div>
              )}
            </Card.Body>
          </Card>
        </main>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="mt-1 text-on-surface">{value}</p>
      </div>
    </div>
  );
}
