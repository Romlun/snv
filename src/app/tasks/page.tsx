"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, Filter, Loader2, Plus, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TaskStatus = 'Not started' | 'In progress' | 'Waiting' | 'Completed' | 'Cancelled';
type TaskPriority = 'Low' | 'Medium' | 'High';
type SortMode = 'due_date' | 'status';

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
  related_to_type: 'donor' | 'church' | 'project' | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completed_date: string | null;
  profiles: ProfileJoin | ProfileJoin[] | null;
}

const taskStatuses: Array<TaskStatus | 'All'> = ['All', 'Not started', 'In progress', 'Waiting', 'Completed', 'Cancelled'];
const activeStatuses: TaskStatus[] = ['Not started', 'In progress', 'Waiting'];

function getAssigneeName(profile: TaskRow['profiles'], fallback: string | null) {
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [sortMode, setSortMode] = useState<SortMode>('due_date');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*, profiles(full_name, email)')
          .order('due_date', { ascending: true, nullsFirst: false });

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
    .filter(task => statusFilter === 'All' || task.status === statusFilter)
    .sort((a, b) => {
      if (sortMode === 'status') {
        return a.status.localeCompare(b.status) || (a.due_date || "").localeCompare(b.due_date || "");
      }

      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-zinc-500">Track follow-ups and mission work across relationships.</p>
        </div>
        <Link href="/tasks/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Task
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <select
            className="px-3 py-2 border rounded-lg dark:bg-zinc-900 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as TaskStatus | 'All')}
          >
            {taskStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <select
          className="px-3 py-2 border rounded-lg dark:bg-zinc-900 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
          value={sortMode}
          onChange={e => setSortMode(e.target.value as SortMode)}
        >
          <option value="due_date">Sort by due date</option>
          <option value="status">Sort by status</option>
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="mt-4 text-zinc-500">Loading tasks...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-600">Error loading tasks: {error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-red-700 underline">Try again</button>
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <CheckCircle2 className="h-8 w-8 text-zinc-300" />
          <p className="mt-4 text-zinc-500">No tasks found.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b dark:bg-zinc-800/50 dark:border-zinc-800 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-4">Task</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Due</th>
                <th className="px-6 py-4">Assigned</th>
                <th className="px-6 py-4 text-right">Linked To</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-zinc-800">
              {visibleTasks.map(task => {
                const overdue = isOverdue(task);
                return (
                  <tr key={task.id} className={overdue ? "bg-red-50/70 dark:bg-red-950/20" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"}>
                    <td className="px-6 py-4">
                      <Link href={`/tasks/${task.id}`} className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline">
                        {task.title}
                      </Link>
                      {task.description ? <p className="text-xs text-zinc-500 line-clamp-1">{task.description}</p> : null}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{task.priority}</td>
                    <td className={`px-6 py-4 ${overdue ? "font-semibold text-red-700 dark:text-red-300" : ""}`}>
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        {formatDate(task.due_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-zinc-400" />
                        {getAssigneeName(task.profiles, task.assigned_to)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right capitalize">{task.related_to_type || "None"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
