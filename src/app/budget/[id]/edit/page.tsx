"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProjectOption {
  id: string;
  name: string;
}

interface FormData {
  category: string;
  name: string;
  needed: string;
  raised: string;
  is_project_based: boolean;
  project_id: string;
}

const suggestedCategories = [
  "General Operations",
  "Projects",
  "Events",
  "Travel",
  "Books & Resources",
  "Staff",
  "Media",
  "Church Visits",
  "Mission Trips",
  "Special Campaigns",
];

export default function EditBudgetEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [formData, setFormData] = useState<FormData>({
    category: "",
    name: "",
    needed: "",
    raised: "",
    is_project_based: false,
    project_id: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: entry }, { data: projectData }] = await Promise.all([
          supabase.from('budget_entries').select('*').eq('id', id).single(),
          supabase.from('projects').select('id, name').order('name'),
        ]);

        setProjects((projectData || []) as ProjectOption[]);

        if (entry) {
          setFormData({
            category: entry.category || "",
            name: entry.name || "",
            needed: String(entry.needed || ""),
            raised: String(entry.raised || ""),
            is_project_based: Boolean(entry.is_project_based),
            project_id: entry.project_id || "",
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
      const { error } = await supabase.from('budget_entries').update({
        category: formData.category,
        name: formData.name,
        needed: Number(formData.needed || 0),
        raised: Number(formData.raised || 0),
        is_project_based: formData.is_project_based,
        project_id: formData.is_project_based && formData.project_id ? formData.project_id : null,
      }).eq('id', id);

      if (error) throw error;
      router.push("/budget");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error updating budget entry");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this budget entry?")) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from('budget_entries').delete().eq('id', id);
      if (error) throw error;
      router.push("/budget");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error deleting budget entry");
    } finally {
      setDeleting(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-zinc-500">Loading budget entry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/budget" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Budget
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Edit Budget Entry</h1>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:hover:bg-red-950/20"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <input
                required
                list="budget-categories"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
              <datalist id="budget-categories">
                {suggestedCategories.map(category => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Needed</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.needed}
                onChange={e => setFormData({ ...formData, needed: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Raised</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.raised}
                onChange={e => setFormData({ ...formData, raised: e.target.value })}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium dark:border-zinc-800">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={formData.is_project_based}
              onChange={e => setFormData({ ...formData, is_project_based: e.target.checked, project_id: e.target.checked ? formData.project_id : "" })}
            />
            Project based
          </label>

          {formData.is_project_based ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
              >
                <option value="">No project selected</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          ) : null}

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
