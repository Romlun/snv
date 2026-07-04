"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  CheckCircle2,
  Filter,
  Loader2,
  Plus,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type TaskStatus =
  | "Not started"
  | "In progress"
  | "Waiting"
  | "Completed"
  | "Cancelled";
type TaskPriority = "Low" | "Medium" | "High";
type SortMode = "due_date" | "status";

interface ProfileJoin {
  full_name: string | null;
  email: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  related_to_id: string | null;
  related_to_type: "donor" | "church" | "project" | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completed_date: string | null;
  profiles: ProfileJoin | ProfileJoin[] | null;
}

const taskStatuses: Array<TaskStatus | "All"> = [
  "All",
  "Not started",
  "In progress",
  "Waiting",
  "Completed",
  "Cancelled",
];
const activeStatuses: TaskStatus[] = ["Not started", "In progress", "Waiting"];

function getAssigneeName(profile: TaskRow["profiles"], fallback: string | null) {
  const row = Array.isArray(profile) ? profile[0] : profile;
  return row?.full_name || row?.email || fallback || "Unassigned";
}

function isOverdue(task: TaskRow) {
  if (!task.due_date || !activeStatuses.includes(task.status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date) < today;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "No due date";
}

function getStatusVariant(status: TaskStatus) {
  if (status === "Completed") return "success";
  if (status === "Cancelled") return "error";
  if (status === "Waiting") return "warning";
  if (status === "In progress") return "primary";
  return "info";
}

function getPriorityVariant(priority: TaskPriority) {
  if (priority === "High") return "error";
  if (priority === "Medium") return "warning";
  return "neutral";
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [sortMode, setSortMode] = useState<SortMode>("due_date");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("tasks")
          .select("*, profiles(full_name, email)")
          .order("due_date", { ascending: true, nullsFirst: false });

        if (error) throw error;
        setTasks((data || []) as TaskRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [supabase]);

  const visibleTasks = tasks
    .filter((task) => statusFilter === "All" || task.status === statusFilter)
    .sort((a, b) => {
      if (sortMode === "status") {
        return (
          a.status.localeCompare(b.status) ||
          (a.due_date || "").localeCompare(b.due_date || "")
        );
      }

      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });

  const todayKey = new Date().toISOString().split("T")[0];
  const completedWeekStart = new Date();
  completedWeekStart.setHours(0, 0, 0, 0);
  completedWeekStart.setDate(completedWeekStart.getDate() - 7);

  const overdueCount = tasks.filter(isOverdue).length;
  const dueTodayCount = tasks.filter(
    (task) =>
      task.due_date === todayKey && activeStatuses.includes(task.status),
  ).length;
  const completedThisWeek = tasks.filter((task) => {
    if (!task.completed_date) return false;
    return new Date(task.completed_date) >= completedWeekStart;
  }).length;
  const highPriorityActive = tasks.filter(
    (task) =>
      task.priority === "High" && activeStatuses.includes(task.status),
  ).length;

  const metrics = [
    {
      label: "Total Tasks",
      value: tasks.length.toLocaleString(),
      detail: "All fetched tasks",
    },
    {
      label: "Overdue",
      value: overdueCount.toLocaleString(),
      detail: "Active and past due",
    },
    {
      label: "Due Today",
      value: dueTodayCount.toLocaleString(),
      detail: "Active tasks due now",
    },
    {
      label: "Completed This Week",
      value: completedThisWeek.toLocaleString(),
      detail: "Completed in last 7 days",
    },
    {
      label: "High Priority",
      value: highPriorityActive.toLocaleString(),
      detail: "Active high-priority tasks",
    },
  ];

  return (
    <div className="space-y-stack-lg">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
            Task Queue
          </p>
          <div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Tasks
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Track follow-ups and mission work across relationships.
            </p>
          </div>
        </div>
        <Button
          type="button"
          icon={Plus}
          onClick={() => {
            window.location.href = "/tasks/new";
          }}
        >
          Add Task
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-5">
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
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-on-surface-variant/70" />
          <select
            className="focus-ring rounded-lg border border-outline-variant/20 bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus-visible:border-primary"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TaskStatus | "All")
            }
          >
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <select
          className="focus-ring rounded-lg border border-outline-variant/20 bg-surface px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus-visible:border-primary"
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
        >
          <option value="due_date">Sort by due date</option>
          <option value="status">Sort by status</option>
        </select>
      </section>

      {loading ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-on-surface-variant">Loading tasks...</p>
        </Card>
      ) : error ? (
        <Card className="border-red-100 bg-red-50 p-8 text-center">
          <p className="text-red-600">Error loading tasks: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-bold text-red-700 underline"
          >
            Try again
          </button>
        </Card>
      ) : visibleTasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <CheckCircle2 className="h-8 w-8 text-on-surface-variant/50" />
          <p className="mt-4 text-on-surface-variant">No tasks found.</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-outline-variant/15 bg-surface-container-low text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Task</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Due</th>
                  <th className="px-6 py-4">Assigned</th>
                  <th className="px-6 py-4 text-right">Linked To</th>
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map((task) => {
                  const overdue = isOverdue(task);

                  return (
                    <tr
                      key={task.id}
                      className={
                        overdue
                          ? "border-t border-red-100 bg-red-50/70 transition-colors hover:bg-red-50"
                          : "border-t border-outline-variant/10 transition-colors hover:bg-primary-container/5"
                      }
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-bold text-on-surface hover:text-primary"
                        >
                          {task.title}
                        </Link>
                        {task.description ? (
                          <p className="line-clamp-1 text-xs text-on-surface-variant">
                            {task.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={getStatusVariant(task.status)}
                          className="px-2 py-0.5 normal-case tracking-normal"
                        >
                          {task.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={getPriorityVariant(task.priority)}
                          className="px-2 py-0.5 normal-case tracking-normal"
                        >
                          {task.priority}
                        </Badge>
                      </td>
                      <td
                        className={`px-6 py-4 ${
                          overdue ? "font-semibold text-red-700" : ""
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-on-surface-variant/70" />
                          {formatDate(task.due_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-on-surface-variant/70" />
                          {getAssigneeName(task.profiles, task.assigned_to)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right capitalize">
                        {task.related_to_type || "None"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
