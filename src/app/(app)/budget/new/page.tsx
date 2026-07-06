"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProjectOption {
  id: string;
  name: string;
}

interface FormData {
  category: string;
  name: string;
  needed: string;
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

export default function NewBudgetEntryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [formData, setFormData] = useState<FormData>({
    category: "General Operations",
    name: "",
    needed: "",
    is_project_based: false,
    project_id: "",
  });

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      setProjects((data || []) as ProjectOption[]);
    }

    fetchProjects();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('budget_entries').insert({
        category: formData.category,
        name: formData.name,
        needed: Number(formData.needed || 0),
        raised: 0,
        is_project_based: formData.is_project_based,
        project_id: formData.is_project_based && formData.project_id ? formData.project_id : null,
      });

      if (error) throw error;
      router.push("/budget");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error creating budget entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/budget" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        <ArrowLeft className="h-4 w-4" />
        Back to Budget
      </Link>

      <div className="bg-white border rounded-xl p-8 dark:bg-zinc-900 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">New Budget Entry</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {suggestedCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
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
              <div className="w-full px-3 py-2 border rounded-lg bg-zinc-50 text-zinc-500 dark:bg-zinc-950 dark:border-zinc-800">
                $0.00
              </div>
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
            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Create Budget Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
