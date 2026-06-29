"use client";

import { use, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

type ProjectStatus = 'Idea' | 'Planning' | 'Active' | 'Waiting' | 'Completed' | 'Cancelled';

interface FormData {
  name: string;
  description: string;
  goal_description: string;
  budget_needed: string;
  current_funding: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  tags: string;
}

const projectStatuses: ProjectStatus[] = ['Idea', 'Planning', 'Active', 'Waiting', 'Completed', 'Cancelled'];

function parseTags(tags: string) {
  return tags
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    goal_description: "",
    budget_needed: "",
    current_funding: "",
    start_date: "",
    end_date: "",
    status: "Planning",
    tags: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();
        if (project) {
          setFormData({
            name: project.name,
            description: project.description || "",
            goal_description: project.goal_description || "",
            budget_needed: String(project.budget_needed || ""),
            current_funding: String(project.current_funding || ""),
            start_date: project.start_date || "",
            end_date: project.end_date || "",
            status: project.status,
            tags: project.tags?.join(", ") || "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = parseTags(formData.tags);
      const { error } = await supabase.from('projects').update({
        name: formData.name,
        description: formData.description || null,
        goal_description: formData.goal_description || null,
        budget_needed: Number(formData.budget_needed || 0),
        current_funding: Number(formData.current_funding || 0),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
        tags: tags.length > 0 ? tags : null,
      }).eq('id', id);

      if (error) throw error;
      router.push(`/projects/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error updating project");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-zinc-500">Loading project data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/projects/${id}`} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Project Name</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Budget Needed</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.budget_needed}
                onChange={e => setFormData({ ...formData, budget_needed: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Funding</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.current_funding}
                onChange={e => setFormData({ ...formData, current_funding: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              >
                {projectStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <input
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Comma-separated"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
              />
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 h-24"
              value={formData.goal_description}
              onChange={e => setFormData({ ...formData, goal_description: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
