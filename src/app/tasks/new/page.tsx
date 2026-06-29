"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TaskStatus = 'Not started' | 'In progress' | 'Waiting' | 'Completed' | 'Cancelled';
type TaskPriority = 'Low' | 'Medium' | 'High';
type RelatedType = 'donor' | 'church' | 'project';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface RelatedRecord {
  id: string;
  name: string;
  type: RelatedType;
}

interface FormData {
  title: string;
  description: string;
  assigned_to: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  related_to_type: RelatedType | "";
  related_to_id: string;
}

const priorities: TaskPriority[] = ['Low', 'Medium', 'High'];
const taskStatuses: TaskStatus[] = ['Not started', 'In progress', 'Waiting', 'Completed', 'Cancelled'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validDateOrNull(value: string) {
  if (!DATE_RE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : null;
}

function dueDateIsoOrNull(value: string) {
  const validDate = validDateOrNull(value);
  return validDate ? new Date(validDate).toISOString() : null;
}

export default function NewTaskPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [relatedRecords, setRelatedRecords] = useState<RelatedRecord[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    priority: "Medium",
    status: "Not started",
    related_to_type: "",
    related_to_id: "",
  });

  useEffect(() => {
    async function fetchOptions() {
      const [{ data: profileData }, { data: donorData }, { data: churchData }, { data: projectData }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').order('full_name'),
        supabase.from('donors').select('id, name').order('name'),
        supabase.from('churches').select('id, name').order('name'),
        supabase.from('projects').select('id, name').order('name'),
      ]);

      setProfiles((profileData || []) as Profile[]);
      setRelatedRecords([
        ...((donorData || []) as Array<{ id: string; name: string }>).map(row => ({ ...row, type: 'donor' as const })),
        ...((churchData || []) as Array<{ id: string; name: string }>).map(row => ({ ...row, type: 'church' as const })),
        ...((projectData || []) as Array<{ id: string; name: string }>).map(row => ({ ...row, type: 'project' as const })),
      ]);
    }

    fetchOptions();
  }, [supabase]);

  const visibleRelatedRecords = relatedRecords.filter(record => record.type === formData.related_to_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('tasks').insert({
        title: formData.title,
        description: formData.description || null,
        assigned_to: formData.assigned_to || null,
        related_to_type: formData.related_to_type || null,
        related_to_id: formData.related_to_type && formData.related_to_id ? formData.related_to_id : null,
        due_date: dueDateIsoOrNull(formData.due_date),
        priority: formData.priority,
        status: formData.status,
      });

      if (error) throw error;
      router.push("/tasks");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error creating task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/tasks" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">Add New Task</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input
              required
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned To</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.assigned_to}
                onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
              >
                <option value="">Unassigned</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>{profile.full_name || profile.email}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              >
                {taskStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Related Type</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.related_to_type}
                onChange={e => setFormData({ ...formData, related_to_type: e.target.value as RelatedType | "", related_to_id: "" })}
              >
                <option value="">None</option>
                <option value="donor">Donor</option>
                <option value="church">Church</option>
                <option value="project">Project</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Related Record</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.related_to_id}
                disabled={!formData.related_to_type}
                onChange={e => setFormData({ ...formData, related_to_id: e.target.value })}
              >
                <option value="">None</option>
                {visibleRelatedRecords.map(record => (
                  <option key={record.id} value={record.id}>{record.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-24"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Create Task"}
          </button>
        </form>
      </div>
    </div>
  );
}
