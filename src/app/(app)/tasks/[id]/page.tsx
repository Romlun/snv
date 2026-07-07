"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  User as UserIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import NotesLog from "@/components/NotesLog";

type TaskStatus = 'Not started' | 'In progress' | 'Waiting' | 'Completed' | 'Cancelled';
const taskStatuses: TaskStatus[] = ['Not started', 'In progress', 'Waiting', 'Completed', 'Cancelled'];
type TaskPriority = 'Low' | 'Medium' | 'High';
type RelatedType = 'donor' | 'church' | 'project';
type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

interface ProfileJoin {
  full_name: string | null;
  email: string | null;
}

interface TaskRow {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  related_to_id: string | null;
  related_to_type: RelatedType | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
}

interface LinkedRecord {
  name: string;
  href: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  is_complete: boolean;
  position: number;
}

function getAssigneeName(profile: TaskRow['profiles'], fallback: string | null) {
  const row = Array.isArray(profile) ? profile[0] : profile;
  return row?.full_name || row?.email || fallback || "Unassigned";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}

function getStatusVariant(status: TaskStatus): BadgeVariant {
  if (status === "Completed") return "success";
  if (status === "Cancelled") return "error";
  if (status === "Waiting") return "warning";
  if (status === "In progress") return "primary";
  return "info";
}

function getPriorityVariant(priority: TaskPriority): BadgeVariant {
  if (priority === "High") return "error";
  if (priority === "Medium") return "warning";
  return "neutral";
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [task, setTask] = useState<TaskRow | null>(null);
  const [linkedRecord, setLinkedRecord] = useState<LinkedRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  async function fetchTask() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*, profiles(full_name, email)')
        .eq('id', id)
        .single();

      if (error) throw error;
      const taskData = data as TaskRow;
      setTask(taskData);

      if (taskData.related_to_id && taskData.related_to_type) {
        const table = taskData.related_to_type === 'donor' ? 'donors' : taskData.related_to_type === 'church' ? 'churches' : 'projects';
        const { data: relatedData } = await supabase
          .from(table)
          .select('id, name')
          .eq('id', taskData.related_to_id)
          .single();

        setLinkedRecord(relatedData ? {
          name: relatedData.name,
          href: `/${table}/${relatedData.id}`,
        } : null);
      } else {
        setLinkedRecord(null);
      }
    } catch (err) {
      console.error(err);
      setTask(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchChecklistItems() {
    try {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .select('id, text, is_complete, position')
        .eq('task_id', id)
        .order('position', { ascending: true });

      if (error) throw error;
      setChecklistItems((data || []) as ChecklistItem[]);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchCurrentUserRole() {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();
      setCurrentUserRole(profile?.role || null);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchTask();
    fetchChecklistItems();
    fetchCurrentUserRole();
  }, [id]);

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'Completed',
          completed_date: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await fetchTask();
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error completing task");
    } finally {
      setCompleting(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (statusSaving) return;
    setStatusSaving(true);
    try {
      const completed_date = newStatus === 'Completed' ? new Date().toISOString() : null;
      const { error } = await supabase.from('tasks').update({ status: newStatus, completed_date }).eq('id', id);
      if (error) throw error;
      setTask(prev => prev ? { ...prev, status: newStatus, completed_date } : null);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleToggleItem = async (itemId: string, nextValue: boolean) => {
    setTogglingItemId(itemId);
    try {
      const { error } = await supabase
        .from('task_checklist_items')
        .update({ is_complete: nextValue })
        .eq('id', itemId);
      if (error) throw error;
      setChecklistItems(prev => prev.map(item => item.id === itemId ? { ...item, is_complete: nextValue } : item));
    } catch (err) {
      console.error(err);
      alert("Error updating item");
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newItemText.trim();
    if (!text) return;

    setAddingItem(true);
    try {
      const nextPosition = checklistItems.length > 0
        ? Math.max(...checklistItems.map(item => item.position)) + 1
        : 0;
      const { data, error } = await supabase
        .from('task_checklist_items')
        .insert({ task_id: id, text, position: nextPosition })
        .select('id, text, is_complete, position')
        .single();

      if (error) throw error;
      setChecklistItems(prev => [...prev, data as ChecklistItem]);
      setNewItemText("");
    } catch (err) {
      console.error(err);
      alert("Error adding item");
    } finally {
      setAddingItem(false);
    }
  };

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-on-surface-variant">Loading task details...</p>
      </Card>
    );
  }

  if (!task) {
    notFound();
  }

  const isComplete = task.status === 'Completed';
  const completeCount = checklistItems.filter(item => item.is_complete).length;
  const canManageChecklist = currentUserRole !== 'Volunteer';
  const assigneeName = getAssigneeName(task.profiles, task.assigned_to);

  return (
    <div className="space-y-gutter">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Link>

      <section className="glass-card overflow-hidden p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
              <Badge variant={getPriorityVariant(task.priority)}>{task.priority} Priority</Badge>
            </div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              {task.title}
            </h1>
            <div className="flex flex-wrap items-center gap-5 text-sm text-on-surface-variant">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-container" />
                Due {formatDate(task.due_date)}
              </span>
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-[10px] font-semibold text-primary">
                  {getInitials(assigneeName)}
                </span>
                Assignee: <span className="font-semibold text-on-surface">{assigneeName}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              icon={Pencil}
              onClick={() => {
                window.location.href = `/tasks/${task.id}/edit`;
              }}
            >
              Edit Task
            </Button>
            <Button
              type="button"
              icon={CheckCircle2}
              onClick={handleMarkComplete}
              disabled={isComplete || completing}
            >
              {completing ? "Completing..." : "Mark Complete"}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <aside className="space-y-gutter lg:col-span-1">
          <Card>
            <h2 className="mb-5 font-headline text-headline-md text-on-surface">
              Task Details
            </h2>
            <div className="space-y-4">
              <DetailRow icon={Calendar} label="Due Date" value={formatDate(task.due_date)} />
              <DetailRow icon={UserIcon} label="Assigned To" value={assigneeName} />
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Completed
                </p>
                <p className="text-sm font-semibold text-on-surface">{formatDate(task.completed_date)}</p>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Status
                </p>
                <Select
                  variant="box"
                  value={task.status}
                  onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                  disabled={statusSaving}
                >
                  {taskStatuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
                {statusSaving ? (
                  <p className="mt-1 text-xs text-on-surface-variant">Saving...</p>
                ) : null}
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Linked Record
                </p>
                {linkedRecord ? (
                  <Link href={linkedRecord.href} className="text-sm font-semibold text-primary hover:underline">
                    {linkedRecord.name}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-on-surface">None</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Related Type
                </p>
                <p className="text-sm font-semibold capitalize text-on-surface">{task.related_to_type || "None"}</p>
              </div>
            </div>
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
                  {new Date(task.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="mb-1 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  Updated
                </p>
                <p className="text-sm font-semibold text-on-surface">
                  {new Date(task.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </aside>

        <main className="space-y-gutter lg:col-span-2">
          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-headline text-headline-md text-on-surface">
              <FileText className="h-4 w-4 text-primary" />
              Description
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
              {task.description || "No description yet."}
            </p>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-headline text-headline-md text-on-surface">
                <ListChecks className="h-4 w-4 text-primary" />
                Action Items
              </h2>
              <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                {completeCount} / {checklistItems.length} complete
              </span>
            </div>
            <div className="space-y-3">
              {checklistItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleItem(item.id, !item.is_complete)}
                  disabled={togglingItemId === item.id}
                  className={
                    item.is_complete
                      ? "flex w-full items-center gap-4 rounded-lg border border-primary-container/10 bg-primary-container/5 p-4 text-left transition-all disabled:opacity-60"
                      : "flex w-full items-center gap-4 rounded-lg border border-outline-variant/30 p-4 text-left transition-all hover:border-primary-container/20 disabled:opacity-60"
                  }
                >
                  <span
                    className={
                      item.is_complete
                        ? "flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-primary-container bg-primary-container text-white"
                        : "flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-outline-variant"
                    }
                  >
                    {item.is_complete ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  <span
                    className={
                      item.is_complete
                        ? "flex-1 text-sm text-on-surface-variant line-through"
                        : "flex-1 text-sm text-on-surface"
                    }
                  >
                    {item.text}
                  </span>
                </button>
              ))}
              {checklistItems.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No action items yet.</p>
              ) : null}
            </div>
            {canManageChecklist ? (
              <form onSubmit={handleAddItem} className="mt-4 flex gap-2">
                <Input
                  variant="box"
                  placeholder="Add another item..."
                  value={newItemText}
                  onChange={e => setNewItemText(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  disabled={addingItem || !newItemText.trim()}
                >
                  {addingItem ? "Adding..." : "Add"}
                </Button>
              </form>
            ) : null}
          </Card>

          <Card>
            <h2 className="mb-4 font-headline text-headline-md text-on-surface">
              Notes / Progress
            </h2>
            <NotesLog entityType="task" entityId={id} />
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
