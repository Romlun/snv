"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";

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
    <div className="mx-auto max-w-2xl space-y-gutter">
      <Link
        href="/budget"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Budget
      </Link>

      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
        <div className="pl-2">
          <div className="mb-8">
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              New Budget Entry
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Allocate resources and track funding for mission activities.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Category</label>
                <Select
                  required
                  variant="box"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {suggestedCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Name</label>
                <Input
                  required
                  variant="box"
                  placeholder="e.g. Winter Outreach 2024"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Needed</label>
                <Input
                  variant="box"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.needed}
                  onChange={e => setFormData({ ...formData, needed: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Raised</label>
                <div className="w-full rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2.5 text-sm text-on-surface-variant">
                  $0.00
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/20 bg-white/40 p-4 transition-colors hover:bg-primary-container/5">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 rounded border-outline-variant text-primary-container focus:ring-primary-container/40"
                checked={formData.is_project_based}
                onChange={e => setFormData({ ...formData, is_project_based: e.target.checked, project_id: e.target.checked ? formData.project_id : "" })}
              />
              <div>
                <p className="text-sm font-semibold text-on-surface">Project based</p>
                <p className="text-xs text-on-surface-variant">
                  Link this entry to a specific mission project.
                </p>
              </div>
            </label>

            {formData.is_project_based ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Project</label>
                <Select
                  variant="box"
                  value={formData.project_id}
                  onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option value="">No project selected</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </Select>
              </div>
            ) : null}

            <div className="flex flex-col items-center gap-4 border-t border-outline-variant/20 pt-6">
              <Button type="submit" disabled={loading} className="w-full md:w-auto md:min-w-60">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Budget Entry"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
