"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { DonorEngagementScore } from "@/components/DonorEngagementScore";
import DateField from "@/components/DateField";
import NotesLog from "@/components/NotesLog";
import PrayerRequestsLog from "@/components/PrayerRequestsLog";
import { RelationshipStatusSelect } from "@/components/RelationshipStatusSelect";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Gift,
  HeartHandshake,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Tag as TagIcon,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Database } from "@/types/database";

type Donor = Database["public"]["Tables"]["donors"]["Row"] & {
  next_step: string | null;
  birthday: string | null;
  address: string | null;
};
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Church = Database["public"]["Tables"]["churches"]["Row"];
type ContactLog = Database["public"]["Tables"]["contact_logs"]["Row"];

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
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? value
    : null;
}

function getProject(projects: GiftHistoryRow["projects"]) {
  return Array.isArray(projects) ? projects[0] : projects;
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

function formatContactMethod(value: string | null | undefined) {
  if (!value) return "Not set";
  return value
    .replace(/[_-]/g, " ")
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
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

export default function DonorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [staff, setStaff] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [giftHistory, setGiftHistory] = useState<GiftHistoryItem[]>([]);
  const [showAddGift, setShowAddGift] = useState(false);
  const [addingGift, setAddingGift] = useState(false);
  const [savingPrayerPartner, setSavingPrayerPartner] = useState(false);
  const [giftForm, setGiftForm] = useState<AddGiftFormData>({
    amount: "",
    project_id: "",
    gift_date: todayDateInputValue(),
    method: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  async function fetchDonorData(showPageLoading = false) {
    try {
      if (showPageLoading) {
        setLoading(true);
      }

      const { data: donorData, error: donorError } = await supabase
        .from("donors")
        .select("*")
        .eq("id", id)
        .single();

      if (donorError) throw donorError;
      setDonor(donorData as Donor);

      if (donorData.assigned_staff_id) {
        const { data: staffData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", donorData.assigned_staff_id)
          .single();
        setStaff(staffData);
      } else {
        setStaff(null);
      }

      if (donorData.church_id) {
        const { data: churchData } = await supabase
          .from("churches")
          .select("*")
          .eq("id", donorData.church_id)
          .single();
        setChurch(churchData);
      } else {
        setChurch(null);
      }

      const { data: logData } = await supabase
        .from("contact_logs")
        .select("*")
        .eq("donor_id", id)
        .order("contact_date", { ascending: false });
      setContactLogs(logData || []);

      const { data: projectData } = await supabase
        .from("projects")
        .select("id, name")
        .eq("status", "Active")
        .order("name");
      setProjects((projectData || []) as ProjectOption[]);

      const { data: giftData } = await supabase
        .from("gifts")
        .select("id, amount, gift_date, notes, method, project_id, projects(name, status)")
        .eq("donor_id", id)
        .order("gift_date", { ascending: false });

      setGiftHistory(
        ((giftData || []) as GiftHistoryRow[]).map((gift) => {
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
        }),
      );
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
    void fetchDonorData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingGift(true);

    try {
      const amount = Number(giftForm.amount);
      if (!amount || amount <= 0) {
        throw new Error("Enter valid amount");
      }

      const giftDate = validDateOrNull(giftForm.gift_date);
      const { error } = await supabase.from("gifts").insert({
        donor_id: id,
        project_id: giftForm.project_id || null,
        amount,
        gift_date: giftDate || undefined,
        method: giftForm.method || null,
        notes: giftForm.notes || null,
      });

      if (error) throw error;

      await fetchDonorData();
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

  async function handlePrayerPartnerToggle() {
    if (!donor || savingPrayerPartner) return;

    const previousValue = donor.is_prayer_partner;
    const newValue = !previousValue;
    setDonor((prev) =>
      prev ? { ...prev, is_prayer_partner: newValue } : prev,
    );
    setSavingPrayerPartner(true);

    const { error } = await supabase
      .from("donors")
      .update({ is_prayer_partner: newValue })
      .eq("id", donor.id);

    setSavingPrayerPartner(false);

    if (error) {
      console.error(error);
      setDonor((prev) =>
        prev ? { ...prev, is_prayer_partner: previousValue } : prev,
      );
      alert("Error updating prayer partner status");
    }
  }

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-on-surface-variant">Loading donor details...</p>
      </Card>
    );
  }

  if (!donor) {
    notFound();
  }

  const supportedProjects = getSupportedProjects(giftHistory);
  const metrics = [
    {
      label: "Lifetime Giving",
      value: formatMoney(donor.lifetime_giving),
      detail: "Total recorded gifts",
    },
    {
      label: "Engagement Score",
      value: `${donor.engagement_score ?? 0}/100`,
      detail: "Based on real activity",
    },
    {
      label: "Last Contact",
      value: formatDate(donor.last_contact_date, "Never"),
      detail: "Most recent interaction",
    },
    {
      label: "Communication",
      value: formatContactMethod(donor.preferred_contact_method),
      detail: "Preferred contact method",
    },
  ];

  return (
    <div className="space-y-stack-lg">
      <Link
        href="/donors"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Donors
      </Link>

      <section className="glass-card overflow-hidden p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-container/15 font-headline text-headline-lg font-semibold text-primary">
              {getInitials(donor.name)}
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{donor.stage ?? "New contact"}</Badge>
                  <RelationshipStatusSelect
                    id={donor.id}
                    table="donors"
                    value={donor.relationship_status ?? "Steady"}
                    onSaved={(relationship_status) =>
                      setDonor((prev) =>
                        prev ? { ...prev, relationship_status } : prev,
                      )
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={donor.is_prayer_partner ? "primary" : "secondary"}
                    icon={HeartHandshake}
                    aria-pressed={donor.is_prayer_partner}
                    disabled={savingPrayerPartner}
                    onClick={() => void handlePrayerPartnerToggle()}
                  >
                    Prayer Partner
                  </Button>
                </div>
                <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
                  {donor.name}
                </h1>
                <p className="text-sm text-on-surface-variant">
                  Donor since {formatDate(donor.created_at, "Not recorded")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  icon={MessageSquare}
                  onClick={() => {
                    window.location.href = `/donors/${donor.id}/log`;
                  }}
                >
                  Log Contact
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon={UserIcon}
                  onClick={() => {
                    window.location.href = `/donors/${donor.id}/edit`;
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
            <DonorEngagementScore
              donorId={donor.id}
              score={donor.engagement_score ?? 0}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-cs-md md:grid-cols-4">
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
          <form
            onSubmit={handleAddGift}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">
                Amount
              </label>
              <Input
                required
                variant="box"
                type="number"
                min="0.01"
                step="0.01"
                value={giftForm.amount}
                onChange={(e) =>
                  setGiftForm({ ...giftForm, amount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">
                Project
              </label>
              <Select
                variant="box"
                value={giftForm.project_id}
                onChange={(e) =>
                  setGiftForm({ ...giftForm, project_id: e.target.value })
                }
              >
                <option value="">None</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </div>
            <DateField
              label="Gift Date"
              value={giftForm.gift_date}
              onChange={(val) => setGiftForm({ ...giftForm, gift_date: val })}
            />
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">
                Method
              </label>
              <Input
                variant="box"
                placeholder="cash, check, card, online"
                value={giftForm.method}
                onChange={(e) =>
                  setGiftForm({ ...giftForm, method: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-on-surface">
                Note
              </label>
              <Textarea
                variant="box"
                value={giftForm.notes}
                onChange={(e) =>
                  setGiftForm({ ...giftForm, notes: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
              <Button type="submit" disabled={addingGift}>
                {addingGift ? "Adding..." : "Save Gift"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddGift(false)}
              >
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
              Personal Details
            </h2>
            <div className="space-y-4">
              <DetailRow icon={Mail} label="Email" value={donor.email || "Not provided"} />
              <DetailRow icon={Phone} label="Phone" value={donor.phone || "Not provided"} />
              <DetailRow
                icon={MessageSquare}
                label="Preferred Contact Method"
                value={formatContactMethod(donor.preferred_contact_method)}
              />
              <DetailRow
                icon={Calendar}
                label="Birthday"
                value={formatDate(donor.birthday)}
              />
              <DetailRow
                icon={MapPin}
                label="Address"
                value={donor.address || "Not provided"}
                preserveLines
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Mission Projects Supported
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
                        <p className="font-semibold text-on-surface">
                          {project.name}
                        </p>
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
                  Church Connection
                </p>
                <p className="text-sm font-semibold text-on-surface">
                  {church?.name || "No church connected"}
                </p>
              </div>
              <TokenGroup
                title="Interests"
                empty="None specified"
                items={donor.interests || []}
              />
              <TokenGroup
                title="Tags"
                empty="No tags"
                items={donor.tags || []}
                icon
              />
            </div>
          </Card>
        </aside>

        <main className="space-y-gutter lg:col-span-2">
          <Card>
            <h2 className="mb-4 font-headline text-headline-md text-on-surface">
              Notes / Next Step
            </h2>
            <NotesLog
              entityType="donor"
              entityId={donor.id}
              entityLabel={donor.name}
              onNextStepSaved={(next_step) =>
                setDonor((prev) => (prev ? { ...prev, next_step } : prev))
              }
              onFollowUpDateSaved={(next_follow_up_date) =>
                setDonor((prev) =>
                  prev ? { ...prev, next_follow_up_date } : prev,
                )
              }
            />
          </Card>

          <PrayerRequestsLog entityType="donor" entityId={donor.id} />

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              icon={FileText}
              onClick={() => {
                window.location.href = `/donors/${donor.id}/statement`;
              }}
            >
              Giving Statement
            </Button>
            <Button
              type="button"
              icon={Plus}
              onClick={() => setShowAddGift((value) => !value)}
            >
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
              <Gift className="h-5 w-5 text-primary" />
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
                          <p className="mt-2 text-sm text-on-surface-variant">
                            {gift.notes}
                          </p>
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
                  Contact Timeline
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Real logged interactions and outcomes.
                </p>
              </div>
              <Link
                href={`/donors/${donor.id}/log`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                + Log Contact
              </Link>
            </Card.Header>
            <Card.Body>
              {contactLogs.length > 0 ? (
                <div className="relative space-y-6 before:absolute before:bottom-0 before:left-5 before:top-0 before:w-px before:bg-outline-variant/20">
                  {contactLogs.map((log) => (
                    <div key={log.id} className="relative flex gap-5">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-primary">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="rounded-xl border border-outline-variant/15 bg-white/40 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-on-surface">
                            {log.type.charAt(0).toUpperCase() +
                              log.type.slice(1)}{" "}
                            interaction
                          </p>
                          <span className="text-xs text-on-surface-variant">
                            {formatDate(log.contact_date)}
                          </span>
                        </div>
                        {log.notes ? (
                          <p className="mt-2 text-sm text-on-surface-variant">
                            {log.notes}
                          </p>
                        ) : null}
                        {log.outcome ? (
                          <p className="mt-2 text-xs italic text-on-surface-variant">
                            Outcome: {log.outcome}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-on-surface-variant">
                  No interactions logged yet.
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <h2 className="mb-4 font-headline text-headline-md text-on-surface">
              Follow-up Snapshot
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-outline-variant/15 bg-white/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <Clock className="h-4 w-4 text-primary" />
                  Next Follow-up
                </div>
                <p className="text-sm text-on-surface-variant">
                  {formatDate(donor.next_follow_up_date, "Not scheduled")}
                </p>
              </div>
              <div className="rounded-xl border border-outline-variant/15 bg-white/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <HeartHandshake className="h-4 w-4 text-primary" />
                  Next Step
                </div>
                <p className="text-sm text-on-surface-variant">
                  {donor.next_step || "Not set"}
                </p>
              </div>
            </div>
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

function TokenGroup({
  title,
  empty,
  items,
  icon = false,
}: {
  title: string;
  empty: string;
  items: string[];
  icon?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full border border-primary-container/20 bg-primary-container/10 px-2.5 py-1 text-xs font-semibold text-primary"
            >
              {icon ? <TagIcon className="h-3 w-3" /> : null}
              {item}
            </span>
          ))
        ) : (
          <span className="text-xs italic text-on-surface-variant">{empty}</span>
        )}
      </div>
    </div>
  );
}
