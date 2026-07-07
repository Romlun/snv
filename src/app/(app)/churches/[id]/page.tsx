"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { ChurchEngagementScore } from "@/components/ChurchEngagementScore";
import DateField from "@/components/DateField";
import NotesLog from "@/components/NotesLog";
import { RelationshipStatusSelect } from "@/components/RelationshipStatusSelect";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarPlus,
  Clock,
  Gift as GiftIcon,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  ChevronRight,
  Phone,
  Plus,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Database } from "@/types/database";

type Church = Database['public']['Tables']['churches']['Row'] & { next_step: string | null };
type Profile = Database['public']['Tables']['profiles']['Row'];
type ContactLog = Database['public']['Tables']['contact_logs']['Row'];
type PlanVisitType = 'call' | 'meeting' | 'church visit' | 'event';

interface ProjectOption {
  id: string;
  name: string;
}

interface GiftProject {
  name: string | null;
  status: string | null;
}

interface GiftHistoryRow {
  id: string;
  amount: number;
  gift_date: string;
  notes: string | null;
  method: string | null;
  project_id: string | null;
  projects: GiftProject | GiftProject[] | null;
}

interface GiftHistoryItem {
  id: string;
  amount: number;
  gift_date: string;
  notes: string | null;
  method: string | null;
  projectId: string | null;
  projectName: string | null;
  projectStatus: string | null;
}

interface SupportedProject {
  id: string;
  name: string;
  status: string | null;
  total: number;
}

interface AddGiftFormData {
  amount: string;
  project_id: string;
  gift_date: string;
  method: string;
  notes: string;
}

const planVisitTypes: PlanVisitType[] = ['call', 'meeting', 'church visit', 'event'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

function getProject(projects: GiftHistoryRow['projects']) {
  return Array.isArray(projects) ? projects[0] : projects;
}

function getPlanVisitTitle(type: PlanVisitType, churchName: string) {
  if (type === 'church visit') return `Planned visit to ${churchName}`;
  if (type === 'meeting') return `Planned meeting with ${churchName}`;
  if (type === 'event') return `Planned event with ${churchName}`;
  return `Planned call to ${churchName}`;
}

function getSupportedProjects(gifts: GiftHistoryItem[]) {
  const projects = new Map<string, SupportedProject>();

  gifts.forEach((gift) => {
    if (!gift.projectId || !gift.projectName) return;

    const existing = projects.get(gift.projectId);
    if (existing) {
      existing.total += Number(gift.amount || 0);
      return;
    }

    projects.set(gift.projectId, {
      id: gift.projectId,
      name: gift.projectName,
      status: gift.projectStatus,
      total: Number(gift.amount || 0),
    });
  });

  return Array.from(projects.values()).sort((a, b) => b.total - a.total);
}

function formatMoney(value: number | null | undefined) {
  return Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(value: string | null | undefined, fallback = "Not provided") {
  if (!value) return fallback;
  const date = DATE_RE.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function ChurchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [church, setChurch] = useState<Church | null>(null);
  const [staff, setStaff] = useState<Profile | null>(null);
  const [visitLogs, setVisitLogs] = useState<ContactLog[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [giftHistory, setGiftHistory] = useState<GiftHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanVisit, setShowPlanVisit] = useState(false);
  const [planVisitForm, setPlanVisitForm] = useState<{ date: string; note: string; type: PlanVisitType }>({ date: "", note: "", type: "church visit" });
  const [planVisitSaving, setPlanVisitSaving] = useState(false);
  const [showAddGift, setShowAddGift] = useState(false);
  const [addingGift, setAddingGift] = useState(false);
  const [giftForm, setGiftForm] = useState<AddGiftFormData>({
    amount: "",
    project_id: "",
    gift_date: todayDateInputValue(),
    method: "",
    notes: "",
  });

  const supabase = createClient();
  const router = useRouter();

  async function fetchChurchData(showPageLoading = false) {
    try {
      if (showPageLoading) {
        setLoading(true);
      }

      const { data: churchData, error: churchError } = await supabase
        .from('churches')
        .select('*')
        .eq('id', id)
        .single();

      if (churchError) throw churchError;
      setChurch(churchData);

      if (churchData.assigned_staff_id) {
        const { data: staffData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', churchData.assigned_staff_id)
          .single();
        setStaff(staffData);
      } else {
        setStaff(null);
      }

      const { data: logData } = await supabase
        .from('contact_logs')
        .select('*')
        .eq('church_id', id)
        .eq('type', 'church visit')
        .order('contact_date', { ascending: false });
      setVisitLogs(logData || []);

      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'Active')
        .order('name');
      setProjects((projectData || []) as ProjectOption[]);

      const { data: giftData } = await supabase
        .from('gifts')
        .select('id, amount, gift_date, notes, method, project_id, projects(name, status)')
        .eq('church_id', id)
        .order('gift_date', { ascending: false });
      setGiftHistory(((giftData || []) as GiftHistoryRow[]).map(gift => {
        const project = getProject(gift.projects);

        return {
          id: gift.id,
          amount: gift.amount,
          gift_date: gift.gift_date,
          notes: gift.notes,
          method: gift.method,
          projectId: gift.project_id,
          projectName: project?.name || null,
          projectStatus: project?.status || null,
        };
      }));
    } catch (err) {
      console.error(err);
    } finally {
      if (showPageLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchChurchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePlanVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planVisitForm.date) return;
    setPlanVisitSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: churchError } = await supabase
        .from('churches')
        .update({ next_visit_date: planVisitForm.date })
        .eq('id', id);
      if (churchError) throw churchError;

      await supabase.from('tasks').insert({
        title: getPlanVisitTitle(planVisitForm.type, church?.name || 'church'),
        related_to_type: 'church',
        related_to_id: id,
        due_date: new Date(planVisitForm.date).toISOString(),
        priority: 'Medium',
        status: 'Not started',
        assigned_to: user?.id,
        description: planVisitForm.note || null,
      });

      setChurch(prev => prev ? { ...prev, next_visit_date: planVisitForm.date } : null);
      setPlanVisitForm({ date: '', note: '', type: 'church visit' });
      setShowPlanVisit(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error planning visit");
    } finally {
      setPlanVisitSaving(false);
    }
  };

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingGift(true);

    try {
      const amount = Number(giftForm.amount);
      if (!amount || amount <= 0) {
        throw new Error("Enter a valid amount");
      }

      const giftDate = validDateOrNull(giftForm.gift_date);
      const { error } = await supabase.from('gifts').insert({
        church_id: id,
        project_id: giftForm.project_id || null,
        amount,
        gift_date: giftDate || undefined,
        method: giftForm.method || null,
        notes: giftForm.notes || null,
      });

      if (error) throw error;

      await fetchChurchData();
      setGiftForm({
        amount: "",
        project_id: "",
        gift_date: todayDateInputValue(),
        method: "",
        notes: "",
      });
      setShowAddGift(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error adding gift");
    } finally {
      setAddingGift(false);
    }
  };

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-on-surface-variant">Loading church details...</p>
      </Card>
    );
  }

  if (!church) {
    notFound();
  }

  const supportedProjects = getSupportedProjects(giftHistory);
  const metrics = [
    {
      label: "Total Giving",
      value: formatMoney(church.total_giving),
      detail: "Total recorded gifts",
    },
    {
      label: "Denomination",
      value: church.denomination || "None",
      detail: "As recorded on file",
    },
    {
      label: "Relationship",
      value: church.relationship_status ?? "Steady",
      detail: "Current partnership status",
    },
  ];

  return (
    <div className="space-y-stack-lg">
      <Link
        href="/churches"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Churches
      </Link>

      <section className="glass-card overflow-hidden p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-container/15 font-headline text-headline-lg font-semibold text-primary">
              {getInitials(church.name)}
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{church.denomination || "No denomination listed"}</Badge>
                  <RelationshipStatusSelect
                    id={church.id}
                    table="churches"
                    value={church.relationship_status ?? "Steady"}
                    onSaved={relationship_status => setChurch(prev => prev ? { ...prev, relationship_status } : prev)}
                  />
                </div>
                <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
                  {church.name}
                </h1>
                <p className="text-sm text-on-surface-variant">
                  Partner since {formatDate(church.created_at, "Not recorded")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  icon={CalendarCheck}
                  onClick={() => {
                    window.location.href = `/churches/${church.id}/visit`;
                  }}
                >
                  Log Visit
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon={Pencil}
                  onClick={() => {
                    window.location.href = `/churches/${church.id}/edit`;
                  }}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/15 bg-white/45 p-4 lg:min-w-64">
            <div>
              <p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                Engagement Score
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Based on recent activity
              </p>
            </div>
            <ChurchEngagementScore churchId={church.id} score={church.engagement_score ?? 0} />
          </div>
        </div>
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

      {showAddGift ? (
        <Card>
          <h2 className="mb-4 font-headline text-headline-md text-on-surface">
            Add Gift
          </h2>
          <form onSubmit={handleAddGift} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Amount</label>
              <Input
                required
                variant="box"
                type="number"
                min="0.01"
                step="0.01"
                value={giftForm.amount}
                onChange={e => setGiftForm({ ...giftForm, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Project</label>
              <Select
                variant="box"
                value={giftForm.project_id}
                onChange={e => setGiftForm({ ...giftForm, project_id: e.target.value })}
              >
                <option value="">None</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </Select>
            </div>
            <DateField
              label="Gift Date"
              value={giftForm.gift_date}
              onChange={val => setGiftForm({ ...giftForm, gift_date: val })}
            />
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Method</label>
              <Input
                variant="box"
                placeholder="cash, check, card, online"
                value={giftForm.method}
                onChange={e => setGiftForm({ ...giftForm, method: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-on-surface">Note</label>
              <Textarea
                variant="box"
                value={giftForm.notes}
                onChange={e => setGiftForm({ ...giftForm, notes: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
              <Button type="submit" disabled={addingGift}>
                {addingGift ? "Adding..." : "Save Gift"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowAddGift(false)}>
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
              Quick Actions
            </h2>
            <div className="space-y-2">
              <QuickAction
                icon={CalendarPlus}
                label="Plan Visit"
                onClick={() => setShowPlanVisit(v => !v)}
              />
              <QuickAction
                icon={CalendarCheck}
                label="Log Visit"
                href={`/churches/${church.id}/visit`}
              />
              <QuickAction
                icon={Pencil}
                label="Edit Profile"
                href={`/churches/${church.id}/edit`}
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Contact Information
            </h2>
            <div className="space-y-4">
              <DetailRow icon={UserIcon} label="Pastor" value={church.pastor || "Not listed"} />
              <DetailRow icon={Mail} label="Email" value={church.email || "No email provided"} />
              <DetailRow icon={Phone} label="Phone" value={church.phone || "No phone provided"} />
              <DetailRow
                icon={MapPin}
                label="Address"
                value={church.address || "No address provided"}
                preserveLines
              />
              <div
                className={
                  church.next_visit_date
                    ? "flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"
                    : "flex items-center gap-3 px-3 py-2 text-sm font-semibold text-on-surface-variant"
                }
              >
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  {church.next_visit_date
                    ? `Next visit: ${new Date(church.next_visit_date + "T00:00:00").toLocaleDateString()}`
                    : "No visit planned"}
                </span>
              </div>
              <DetailRow icon={Clock} label="Next Step" value={church.next_step || "Not set"} />
            </div>
          </Card>

          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Projects Supported
            </h2>
            {supportedProjects.length > 0 ? (
              <div className="space-y-3">
                {supportedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl border border-outline-variant/15 bg-white/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">{project.name}</p>
                        <p className="mt-1 text-sm tabular-nums text-on-surface-variant">
                          {formatMoney(project.total)} given
                        </p>
                      </div>
                      {project.status ? (
                        <Badge variant="neutral">{project.status}</Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">
                No project-linked gifts yet.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Internal Details
            </h2>
            <div className="space-y-5">
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Assigned To
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <UserIcon className="h-4 w-4 text-primary" />
                  {staff?.full_name || "Unassigned"}
                </div>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Organization ID
                </p>
                <p className="break-all text-sm font-semibold text-on-surface">{church.org_id}</p>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Church ID
                </p>
                <p className="break-all text-sm font-semibold text-on-surface">{church.id}</p>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Created
                </p>
                <p className="text-sm font-semibold text-on-surface">
                  {church.created_at ? new Date(church.created_at).toLocaleString() : "Not recorded"}
                </p>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Updated
                </p>
                <p className="text-sm font-semibold text-on-surface">
                  {church.updated_at ? new Date(church.updated_at).toLocaleString() : "Not recorded"}
                </p>
              </div>
            </div>
          </Card>
        </aside>

        <main className="space-y-gutter lg:col-span-2">
          <Card>
            <h2 className="mb-4 font-headline text-headline-md text-on-surface">
              Notes / Next Step
            </h2>
            <NotesLog
              entityType="church"
              entityId={church.id}
              entityLabel={church.name}
              onNextStepSaved={next_step => setChurch(prev => prev ? { ...prev, next_step } : prev)}
              onFollowUpDateSaved={next_visit_date => setChurch(prev => prev ? { ...prev, next_visit_date } : prev)}
            />
          </Card>

          <div className="flex justify-end">
            <Button type="button" icon={Plus} onClick={() => setShowAddGift(value => !value)}>
              Add Gift
            </Button>
          </div>

          <Card padding="none" className="overflow-hidden">
            <Card.Header>
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Gift History
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Recorded gifts and project designations.
                </p>
              </div>
              <GiftIcon className="h-5 w-5 text-primary" />
            </Card.Header>
            <Card.Body>
              {giftHistory.length > 0 ? (
                <div className="space-y-3">
                  {giftHistory.map((gift) => (
                    <div
                      key={gift.id}
                      className="flex flex-col gap-3 rounded-xl border border-outline-variant/15 bg-white/40 p-4 transition-colors hover:bg-primary-container/5 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-on-surface">
                          {gift.projectName || "General gift"}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {formatDate(gift.gift_date)}
                          {gift.method ? ` • ${gift.method}` : ""}
                        </p>
                        {gift.notes ? (
                          <p className="mt-2 text-sm text-on-surface-variant">{gift.notes}</p>
                        ) : null}
                      </div>
                      <p className="text-sm font-bold tabular-nums text-primary">
                        {formatMoney(gift.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-on-surface-variant">
                  No gifts recorded yet.
                </div>
              )}
            </Card.Body>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <Card.Header>
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Visit History
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Real logged visits and outcomes.
                </p>
              </div>
              <Link
                href={`/churches/${church.id}/visit`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                + Log Visit
              </Link>
            </Card.Header>
            {showPlanVisit ? (
              <div className="space-y-3 border-b border-outline-variant/15 bg-primary-container/5 p-4">
                <form onSubmit={handlePlanVisit} className="space-y-3">
                  <DateField
                    label="Planned Visit Date"
                    value={planVisitForm.date}
                    onChange={val => setPlanVisitForm(f => ({ ...f, date: val }))}
                    required
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-on-surface">Type</label>
                    <Select
                      variant="box"
                      value={planVisitForm.type}
                      onChange={e => setPlanVisitForm(f => ({ ...f, type: e.target.value as PlanVisitType }))}
                    >
                      {planVisitTypes.map(type => (
                        <option key={type} value={type}>
                          {type === 'church visit' ? 'Visit' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-on-surface">Note (optional)</label>
                    <Input
                      variant="box"
                      placeholder="Any details about the visit..."
                      value={planVisitForm.note}
                      onChange={e => setPlanVisitForm(f => ({ ...f, note: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" size="sm" disabled={planVisitSaving || !planVisitForm.date}>
                      {planVisitSaving ? "Scheduling..." : "Schedule Visit"}
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setShowPlanVisit(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            ) : null}
            <Card.Body>
              {visitLogs.length > 0 ? (
                <div className="relative space-y-6 before:absolute before:bottom-0 before:left-5 before:top-0 before:w-px before:bg-outline-variant/20">
                  {visitLogs.map((log) => (
                    <div key={log.id} className="relative flex gap-5">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-primary">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div className="rounded-xl border border-outline-variant/15 bg-white/40 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-on-surface">Church visit</p>
                          <span className="text-xs text-on-surface-variant">
                            {formatDate(log.contact_date)}
                          </span>
                        </div>
                        {log.notes ? (
                          <p className="mt-2 text-sm text-on-surface-variant">{log.notes}</p>
                        ) : null}
                        {log.outcome ? (
                          <p className="mt-2 text-xs italic text-on-surface-variant">
                            Outcome: {log.outcome}
                          </p>
                        ) : null}
                        {log.next_step ? (
                          <p className="mt-2 text-xs italic text-on-surface-variant">
                            Next step: {log.next_step}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-on-surface-variant">
                  No visits logged yet.
                </div>
              )}
            </Card.Body>
          </Card>
        </main>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: typeof CalendarPlus;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="flex items-center gap-3 text-sm font-semibold text-on-surface">
        <Icon className="h-4 w-4 text-primary-container" />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-on-surface-variant" />
    </>
  );

  const className =
    "flex w-full items-center justify-between rounded-lg border border-outline-variant/20 bg-white/50 px-4 py-3 text-left transition-colors hover:border-primary-container/40 hover:bg-primary-container/5";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  preserveLines = false,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  preserveLines?: boolean;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p
          className={
            preserveLines
              ? "mt-1 whitespace-pre-line text-on-surface"
              : "mt-1 text-on-surface"
          }
        >
          {value}
        </p>
      </div>
    </div>
  );
}
