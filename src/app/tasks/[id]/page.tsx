"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Loader2, Save, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TaskStatus = 'Not started' | 'In progress' | 'Waiting' | 'Completed' | 'Cancelled';
const taskStatuses: TaskStatus[] = ['Not started', 'In progress', 'Waiting', 'Completed', 'Cancelled'];
type TaskPriority = 'Low' | 'Medium' | 'High';
type RelatedType = 'donor' | 'church' | 'project';

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

function getAssigneeName(profile: TaskRow['profiles'], fallback: string | null) {
  const row = Array.isArray(profile) ? profile[0] : profile;
  return row?.full_name || row?.email || fallback || "Unassigned";
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
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
  const [descText, setDescText] = useState("");
  const [descSaving, setDescSaving] = useState(false);

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
      setDescText(taskData.description || "");

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

  useEffect(() => {
    fetchTask();
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

  const handleSaveNotes = async () => {
    setDescSaving(true);
    try {
      const { error } = await supabase.from('tasks').update({ description: descText || null }).eq('id', id);
      if (error) throw error;
      setTask(prev => prev ? { ...prev, description: descText || null } : null);
    } catch (err) {
      console.error(err);
      alert("Error saving notes");
    } finally {
      setDescSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-zinc-500">Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    notFound();
  }

  const isComplete = task.status === 'Completed';

  return (
    <div className="space-y-6">
      <Link href="/tasks" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
            <Link href={`/tasks/${task.id}/edit`} className="text-sm font-medium text-blue-600 hover:underline">Edit</Link>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {task.status}
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
              {task.priority}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleMarkComplete}
          disabled={isComplete || completing}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Mark Complete
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Task Details</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>Due: {formatDate(task.due_date)}</span>
              </div>
              <div className="flex items-center gap-3">
                <UserIcon className="h-4 w-4 text-zinc-400" />
                <span>{getAssigneeName(task.profiles, task.assigned_to)}</span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Completed</p>
                <p className="font-medium">{formatDate(task.completed_date)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Status</p>
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                  disabled={statusSaving}
                  className="text-sm border rounded-md px-2 py-1 dark:bg-zinc-950 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {taskStatuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {statusSaving && <span className="ml-2 text-xs text-zinc-400">Saving…</span>}
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Linked Record</p>
                {linkedRecord ? (
                  <Link href={linkedRecord.href} className="font-medium text-blue-600 hover:underline">
                    {linkedRecord.name}
                  </Link>
                ) : (
                  <p className="font-medium">None</p>
                )}
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Related Type</p>
                <p className="font-medium capitalize">{task.related_to_type || "None"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Related ID</p>
                <p className="font-medium break-all">{task.related_to_id || "None"}</p>
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Internal Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Organization ID</p>
                <p className="text-sm font-medium break-all">{task.org_id}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Task ID</p>
                <p className="text-sm font-medium break-all">{task.id}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Created</p>
                <p className="text-sm font-medium">{new Date(task.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Updated</p>
                <p className="text-sm font-medium">{new Date(task.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
            <h2 className="font-semibold mb-4">Notes / Progress</h2>
            <textarea
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-y text-sm"
              value={descText}
              onChange={e => setDescText(e.target.value)}
              placeholder="Add notes or track progress..."
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={descSaving}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {descSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Notes
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
