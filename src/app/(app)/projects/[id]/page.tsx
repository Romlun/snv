"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import DateField from "@/components/DateField";
import TaskCompleteToggle from "@/components/TaskCompleteToggle";
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
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type ProjectStatus = 'Idea' | 'Planning' | 'Active' | 'Waiting' | 'Completed' | 'Cancelled';
type TaskStatus = "Not started" | "In progress" | "Waiting" | "Completed" | "Cancelled";
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

interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  status: TaskStatus;
  start_date: string | null;
  end_date: string | null;
  position: number;
}

interface ProjectTask {
  id: string;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
  status: TaskStatus | null;
  phase_id: string | null;
}

interface AddFundsFormData {
  amount: string;
  donor_id: string;
  gift_date: string;
  method: string;
  notes: string;
}

interface PhaseFormData {
  name: string;
  status: TaskStatus;
  start_date: string;
  end_date: string;
}

interface ActionItemFormData {
  title: string;
  assigned_to: string;
  due_date: string;
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

const PHASE_STATUS_BADGE_VARIANT: Record<TaskStatus, BadgeVariant> = {
  "Not started": "neutral",
  "In progress": "info",
  Waiting: "warning",
  Completed: "success",
  Cancelled: "error",
};

const phaseStatuses: TaskStatus[] = [
  "Not started",
  "In progress",
  "Waiting",
  "Completed",
  "Cancelled",
];

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

function emptyPhaseForm(): PhaseFormData {
  return {
    name: "",
    status: "Not started",
    start_date: "",
    end_date: "",
  };
}

function emptyActionItemForm(): ActionItemFormData {
  return {
    title: "",
    assigned_to: "",
    due_date: "",
  };
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
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addingFunds, setAddingFunds] = useState(false);
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [savingPhase, setSavingPhase] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [phaseForm, setPhaseForm] = useState<PhaseFormData>(emptyPhaseForm());
  const [actionItemPhaseId, setActionItemPhaseId] = useState<string | null>(null);
  const [savingActionItem, setSavingActionItem] = useState(false);
  const [actionItemForm, setActionItemForm] = useState<ActionItemFormData>(emptyActionItemForm());
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

      const { data: phaseData } = await supabase
        .from('project_phases')
        .select('id, project_id, name, status, start_date, end_date, position')
        .eq('project_id', id)
        .order('position', { ascending: true });
      setPhases((phaseData || []) as ProjectPhase[]);

      const { data: taskData } = await supabase
        .from('tasks')
        .select('id, title, assigned_to, due_date, status, phase_id')
        .eq('related_to_type', 'project')
        .eq('related_to_id', id)
        .order('due_date', { ascending: true, nullsFirst: false });
      setProjectTasks((taskData || []) as ProjectTask[]);

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

  const handleAddPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPhase(true);

    try {
      const { error } = await supabase.from('project_phases').insert({
        project_id: id,
        name: phaseForm.name,
        status: phaseForm.status,
        start_date: validDateOrNull(phaseForm.start_date),
        end_date: validDateOrNull(phaseForm.end_date),
        position: phases.length,
      });

      if (error) throw error;

      await fetchProjectData();
      setPhaseForm(emptyPhaseForm());
      setShowAddPhase(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error adding phase");
    } finally {
      setSavingPhase(false);
    }
  };

  const startEditingPhase = (phase: ProjectPhase) => {
    setEditingPhaseId(phase.id);
    setPhaseForm({
      name: phase.name,
      status: phase.status,
      start_date: phase.start_date || "",
      end_date: phase.end_date || "",
    });
  };

  const handleUpdatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhaseId) return;
    setSavingPhase(true);

    try {
      const { error } = await supabase
        .from('project_phases')
        .update({
          name: phaseForm.name,
          status: phaseForm.status,
          start_date: validDateOrNull(phaseForm.start_date),
          end_date: validDateOrNull(phaseForm.end_date),
        })
        .eq('id', editingPhaseId);

      if (error) throw error;

      await fetchProjectData();
      setEditingPhaseId(null);
      setPhaseForm(emptyPhaseForm());
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error updating phase");
    } finally {
      setSavingPhase(false);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!window.confirm("Delete this phase? Existing tasks will move to No Phase.")) return;

    try {
      const { error } = await supabase.from('project_phases').delete().eq('id', phaseId);
      if (error) throw error;
      await fetchProjectData();
      if (editingPhaseId === phaseId) {
        setEditingPhaseId(null);
        setPhaseForm(emptyPhaseForm());
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error deleting phase");
    }
  };

  const handleAddActionItem = async (e: React.FormEvent, phaseId: string) => {
    e.preventDefault();
    setSavingActionItem(true);

    try {
      const dueDate = validDateOrNull(actionItemForm.due_date);
      const { error } = await supabase.from('tasks').insert({
        title: actionItemForm.title,
        assigned_to: actionItemForm.assigned_to || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        phase_id: phaseId,
        related_to_type: 'project',
        related_to_id: id,
        status: 'Not started',
        priority: 'Medium',
      });

      if (error) throw error;

      await fetchProjectData();
      setActionItemForm(emptyActionItemForm());
      setActionItemPhaseId(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error adding action item");
    } finally {
      setSavingActionItem(false);
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
  const tasksByPhase = new Map<string, ProjectTask[]>();
  projectTasks.forEach(task => {
    if (!task.phase_id) return;
    const existing = tasksByPhase.get(task.phase_id) || [];
    existing.push(task);
    tasksByPhase.set(task.phase_id, existing);
  });
  const unphasedTasks = projectTasks.filter(task => !task.phase_id);
  const getAssigneeName = (assignedTo: string | null) =>
    assignedStaff.find(person => person.id === assignedTo)?.name || null;

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
          <Card padding="none" className="overflow-hidden">
            <Card.Header>
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Phases & Action Items
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Plan the project in custom phases and track related tasks.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setShowAddPhase(value => !value);
                  setEditingPhaseId(null);
                  setPhaseForm(emptyPhaseForm());
                }}
              >
                Add Phase
              </Button>
            </Card.Header>
            <Card.Body>
              {showAddPhase ? (
                <form
                  onSubmit={handleAddPhase}
                  className="mb-5 grid grid-cols-1 gap-4 rounded-xl border border-outline-variant/15 bg-white/45 p-4 md:grid-cols-2"
                >
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-on-surface">Name</label>
                    <Input
                      required
                      variant="box"
                      value={phaseForm.name}
                      onChange={e => setPhaseForm({ ...phaseForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Status</label>
                    <Select
                      variant="box"
                      value={phaseForm.status}
                      onChange={e => setPhaseForm({ ...phaseForm, status: e.target.value as TaskStatus })}
                    >
                      {phaseStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </Select>
                  </div>
                  <DateField
                    label="Start Date"
                    value={phaseForm.start_date}
                    onChange={val => setPhaseForm({ ...phaseForm, start_date: val })}
                  />
                  <DateField
                    label="End Date"
                    value={phaseForm.end_date}
                    onChange={val => setPhaseForm({ ...phaseForm, end_date: val })}
                  />
                  <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
                    <Button type="submit" disabled={savingPhase}>
                      {savingPhase ? "Saving..." : "Save Phase"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowAddPhase(false);
                        setPhaseForm(emptyPhaseForm());
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}

              {phases.length > 0 ? (
                <div className="space-y-4">
                  {phases.map(phase => {
                    const phaseTasks = tasksByPhase.get(phase.id) || [];
                    const isEditing = editingPhaseId === phase.id;

                    return (
                      <div
                        key={phase.id}
                        className="rounded-xl border border-outline-variant/15 bg-white/40 p-4"
                      >
                        {isEditing ? (
                          <form onSubmit={handleUpdatePhase} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-sm font-semibold text-on-surface">Name</label>
                              <Input
                                required
                                variant="box"
                                value={phaseForm.name}
                                onChange={e => setPhaseForm({ ...phaseForm, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-on-surface">Status</label>
                              <Select
                                variant="box"
                                value={phaseForm.status}
                                onChange={e => setPhaseForm({ ...phaseForm, status: e.target.value as TaskStatus })}
                              >
                                {phaseStatuses.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </Select>
                            </div>
                            <DateField
                              label="Start Date"
                              value={phaseForm.start_date}
                              onChange={val => setPhaseForm({ ...phaseForm, start_date: val })}
                            />
                            <DateField
                              label="End Date"
                              value={phaseForm.end_date}
                              onChange={val => setPhaseForm({ ...phaseForm, end_date: val })}
                            />
                            <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
                              <Button type="submit" disabled={savingPhase}>
                                {savingPhase ? "Saving..." : "Save Changes"}
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                  setEditingPhaseId(null);
                                  setPhaseForm(emptyPhaseForm());
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-headline text-headline-md text-on-surface">
                                    {phase.name}
                                  </h3>
                                  <Badge variant={PHASE_STATUS_BADGE_VARIANT[phase.status]}>
                                    {phase.status}
                                  </Badge>
                                </div>
                                {phase.start_date || phase.end_date ? (
                                  <p className="mt-1 text-sm text-on-surface-variant">
                                    {formatDate(phase.start_date, "No start")} - {formatDate(phase.end_date, "No end")}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  aria-label={`Edit ${phase.name}`}
                                  className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/20 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                                  onClick={() => startEditingPhase(phase)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Delete ${phase.name}`}
                                  className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-700 transition-colors hover:bg-red-50"
                                  onClick={() => handleDeletePhase(phase.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 space-y-3">
                              {phaseTasks.length > 0 ? (
                                phaseTasks.map(task => (
                                  <div
                                    key={task.id}
                                    className="flex flex-col gap-3 rounded-lg border border-outline-variant/10 bg-white/45 p-3 transition-colors hover:bg-primary-container/5 sm:flex-row sm:items-start sm:justify-between"
                                  >
                                    <div className="flex items-start gap-3">
                                      <TaskCompleteToggle
                                        taskId={task.id}
                                        status={task.status || "Not started"}
                                        onToggled={() => fetchProjectData()}
                                      />
                                      <div>
                                        <Link
                                          href={`/tasks/${task.id}`}
                                          className="font-semibold text-on-surface hover:text-primary"
                                        >
                                          {task.title}
                                        </Link>
                                        <p className="mt-1 text-xs text-on-surface-variant">
                                          {getAssigneeName(task.assigned_to) || "Unassigned"}
                                          {task.due_date ? ` • Due ${formatDate(task.due_date)}` : ""}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant={PHASE_STATUS_BADGE_VARIANT[task.status || "Not started"]}>
                                      {task.status || "Not started"}
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <p className="rounded-lg border border-dashed border-outline-variant/20 p-3 text-sm text-on-surface-variant">
                                  No action items in this phase yet.
                                </p>
                              )}
                            </div>

                            {actionItemPhaseId === phase.id ? (
                              <form
                                onSubmit={event => handleAddActionItem(event, phase.id)}
                                className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-outline-variant/15 bg-white/50 p-4 md:grid-cols-2"
                              >
                                <div className="space-y-2 md:col-span-2">
                                  <label className="text-sm font-semibold text-on-surface">Title</label>
                                  <Input
                                    required
                                    variant="box"
                                    value={actionItemForm.title}
                                    onChange={e => setActionItemForm({ ...actionItemForm, title: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-semibold text-on-surface">Assigned To</label>
                                  <Select
                                    variant="box"
                                    value={actionItemForm.assigned_to}
                                    onChange={e => setActionItemForm({ ...actionItemForm, assigned_to: e.target.value })}
                                  >
                                    <option value="">Unassigned</option>
                                    {assignedStaff.map(person => (
                                      <option key={person.id} value={person.id}>{person.name}</option>
                                    ))}
                                  </Select>
                                </div>
                                <DateField
                                  label="Due Date"
                                  value={actionItemForm.due_date}
                                  onChange={val => setActionItemForm({ ...actionItemForm, due_date: val })}
                                />
                                <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
                                  <Button type="submit" disabled={savingActionItem}>
                                    {savingActionItem ? "Adding..." : "Save Action Item"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                      setActionItemPhaseId(null);
                                      setActionItemForm(emptyActionItemForm());
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <button
                                type="button"
                                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-container"
                                onClick={() => {
                                  setActionItemPhaseId(phase.id);
                                  setActionItemForm(emptyActionItemForm());
                                }}
                              >
                                <Plus className="h-4 w-4" />
                                Add Action Item
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {unphasedTasks.length > 0 ? (
                    <div className="rounded-xl border border-outline-variant/15 bg-white/30 p-4">
                      <h3 className="font-headline text-headline-md text-on-surface">
                        No Phase
                      </h3>
                      <div className="mt-4 space-y-3">
                        {unphasedTasks.map(task => (
                          <div
                            key={task.id}
                            className="flex flex-col gap-3 rounded-lg border border-outline-variant/10 bg-white/45 p-3 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div className="flex items-start gap-3">
                              <TaskCompleteToggle
                                taskId={task.id}
                                status={task.status || "Not started"}
                                onToggled={() => fetchProjectData()}
                              />
                              <div>
                                <Link
                                  href={`/tasks/${task.id}`}
                                  className="font-semibold text-on-surface hover:text-primary"
                                >
                                  {task.title}
                                </Link>
                                <p className="mt-1 text-xs text-on-surface-variant">
                                  {getAssigneeName(task.assigned_to) || "Unassigned"}
                                  {task.due_date ? ` • Due ${formatDate(task.due_date)}` : ""}
                                </p>
                              </div>
                            </div>
                            <Badge variant={PHASE_STATUS_BADGE_VARIANT[task.status || "Not started"]}>
                              {task.status || "Not started"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : unphasedTasks.length > 0 ? (
                <div className="rounded-xl border border-outline-variant/15 bg-white/30 p-4">
                  <h3 className="font-headline text-headline-md text-on-surface">
                    No Phase
                  </h3>
                  <div className="mt-4 space-y-3">
                    {unphasedTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex flex-col gap-3 rounded-lg border border-outline-variant/10 bg-white/45 p-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <TaskCompleteToggle
                            taskId={task.id}
                            status={task.status || "Not started"}
                            onToggled={() => fetchProjectData()}
                          />
                          <div>
                            <Link
                              href={`/tasks/${task.id}`}
                              className="font-semibold text-on-surface hover:text-primary"
                            >
                              {task.title}
                            </Link>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {getAssigneeName(task.assigned_to) || "Unassigned"}
                              {task.due_date ? ` • Due ${formatDate(task.due_date)}` : ""}
                            </p>
                          </div>
                        </div>
                        <Badge variant={PHASE_STATUS_BADGE_VARIANT[task.status || "Not started"]}>
                          {task.status || "Not started"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-on-surface-variant">
                  No phases or action items yet.
                </div>
              )}
            </Card.Body>
          </Card>

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
