"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DateField from "@/components/DateField";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Database } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProjectStatus =
  | "Idea"
  | "Planning"
  | "Active"
  | "Waiting"
  | "Completed"
  | "Cancelled";

interface FormData {
  name: string;
  description: string;
  goal_description: string;
  budget_needed: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  tags: string;
}

const projectStatuses: ProjectStatus[] = [
  "Idea",
  "Planning",
  "Active",
  "Waiting",
  "Completed",
  "Cancelled",
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validDateOrNull(value: string) {
  if (!DATE_RE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? value
    : null;
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}

function selectedValues(select: HTMLSelectElement) {
  return Array.from(select.selectedOptions, option => option.value);
}

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    goal_description: "",
    budget_needed: "",
    start_date: "",
    end_date: "",
    status: "Planning",
    tags: "",
  });

  useEffect(() => {
    async function fetchStaff() {
      const { data } = await supabase.from("profiles").select("*").order("full_name");
      setStaff(data || []);
    }

    fetchStaff();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = parseTags(formData.tags);
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: formData.name,
          description: formData.description || null,
          goal_description: formData.goal_description || null,
          budget_needed: Number(formData.budget_needed || 0),
          start_date: validDateOrNull(formData.start_date),
          end_date: validDateOrNull(formData.end_date),
          status: formData.status,
          tags: tags.length > 0 ? tags : null,
        })
        .select("id")
        .single();

      if (error) throw error;

      if (selectedStaffIds.length > 0) {
        const { error: staffError } = await supabase.from("project_staff").insert(
          selectedStaffIds.map(staffId => ({
            project_id: project.id,
            staff_id: staffId,
          })),
        );

        if (staffError) throw staffError;
      }

      router.push("/projects");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error creating project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-gutter">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
        <div className="pl-2">
          <div className="mb-8">
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Add New Project
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Capture project goals, timeline, funding, and team ownership.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Project Details
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Project Name
                  </label>
                  <Input
                    required
                    variant="box"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Budget Needed
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    variant="box"
                    value={formData.budget_needed}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        budget_needed: e.target.value,
                      })
                    }
                  />
                </div>
                <DateField
                  label="Start Date"
                  value={formData.start_date}
                  onChange={val => setFormData({ ...formData, start_date: val })}
                />
                <DateField
                  label="End Date"
                  value={formData.end_date}
                  onChange={val => setFormData({ ...formData, end_date: val })}
                />
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Status
                  </label>
                  <Select
                    variant="box"
                    value={formData.status}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        status: e.target.value as ProjectStatus,
                      })
                    }
                  >
                    {projectStatuses.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Tags
                  </label>
                  <Input
                    variant="box"
                    placeholder="Comma-separated"
                    value={formData.tags}
                    onChange={e =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Team
                </h2>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Assigned Staff
                </label>
                <Select
                  multiple
                  variant="box"
                  className="min-h-32"
                  value={selectedStaffIds}
                  onChange={e => setSelectedStaffIds(selectedValues(e.currentTarget))}
                >
                  {staff.map(row => (
                    <option key={row.id} value={row.id}>
                      {row.full_name || row.email}
                    </option>
                  ))}
                </Select>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Narrative
                </h2>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Description
                </label>
                <Textarea
                  variant="box"
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Goal Description
                </label>
                <Textarea
                  variant="box"
                  value={formData.goal_description}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      goal_description: e.target.value,
                    })
                  }
                />
              </div>
            </section>

            <div className="flex flex-col items-center gap-4 border-t border-outline-variant/20 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto md:min-w-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
