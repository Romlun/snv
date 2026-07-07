"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DateField from "@/components/DateField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";

type TaskStatus =
  | "Not started"
  | "In progress"
  | "Waiting"
  | "Completed"
  | "Cancelled";
type TaskPriority = "Low" | "Medium" | "High";
type RelatedType = "donor" | "church" | "project";

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

interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  position: number;
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
  phase_id: string;
}

const priorities: TaskPriority[] = ["Low", "Medium", "High"];
const taskStatuses: TaskStatus[] = [
  "Not started",
  "In progress",
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
  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    priority: "Medium",
    status: "Not started",
    related_to_type: "",
    related_to_id: "",
    phase_id: "",
  });

  useEffect(() => {
    async function fetchOptions() {
      const [
        { data: profileData },
        { data: donorData },
        { data: churchData },
        { data: projectData },
        { data: phaseData },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").order("full_name"),
        supabase.from("donors").select("id, name").order("name"),
        supabase.from("churches").select("id, name").order("name"),
        supabase.from("projects").select("id, name").order("name"),
        supabase.from("project_phases").select("id, project_id, name, position").order("position"),
      ]);

      setProfiles((profileData || []) as Profile[]);
      setProjectPhases((phaseData || []) as ProjectPhase[]);
      setRelatedRecords([
        ...((donorData || []) as Array<{ id: string; name: string }>).map(row => ({
          ...row,
          type: "donor" as const,
        })),
        ...((churchData || []) as Array<{ id: string; name: string }>).map(row => ({
          ...row,
          type: "church" as const,
        })),
        ...((projectData || []) as Array<{ id: string; name: string }>).map(row => ({
          ...row,
          type: "project" as const,
        })),
      ]);
    }

    fetchOptions();
  }, [supabase]);

  const visibleRelatedRecords = relatedRecords.filter(
    record => record.type === formData.related_to_type,
  );
  const visibleProjectPhases = projectPhases.filter(
    phase => phase.project_id === formData.related_to_id,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("tasks").insert({
        title: formData.title,
        description: formData.description || null,
        assigned_to: formData.assigned_to || null,
        related_to_type: formData.related_to_type || null,
        related_to_id:
          formData.related_to_type && formData.related_to_id
            ? formData.related_to_id
            : null,
        phase_id:
          formData.related_to_type === "project" && formData.related_to_id
            ? formData.phase_id || null
            : null,
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
    <div className="mx-auto max-w-2xl space-y-gutter">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Link>

      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
        <div className="pl-2">
          <div className="mb-8">
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Add New Task
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Capture the work, owner, timing, and related record.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Task Details
                </h2>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Title
                </label>
                <Input
                  required
                  variant="box"
                  value={formData.title}
                  onChange={e =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Assigned To
                  </label>
                  <Select
                    variant="box"
                    value={formData.assigned_to}
                    onChange={e =>
                      setFormData({ ...formData, assigned_to: e.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {profiles.map(profile => (
                      <option key={profile.id} value={profile.id}>
                        {profile.full_name || profile.email}
                      </option>
                    ))}
                  </Select>
                </div>
                <DateField
                  label="Due Date"
                  value={formData.due_date}
                  onChange={val => setFormData({ ...formData, due_date: val })}
                />
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Priority
                  </label>
                  <Select
                    variant="box"
                    value={formData.priority}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </Select>
                </div>
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
                        status: e.target.value as TaskStatus,
                      })
                    }
                  >
                    {taskStatuses.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Related Record
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Related Type
                  </label>
                  <Select
                    variant="box"
                    value={formData.related_to_type}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        related_to_type: e.target.value as RelatedType | "",
                        related_to_id: "",
                        phase_id: "",
                      })
                    }
                  >
                    <option value="">None</option>
                    <option value="donor">Donor</option>
                    <option value="church">Church</option>
                    <option value="project">Project</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">
                    Related Record
                  </label>
                  <Select
                    variant="box"
                    value={formData.related_to_id}
                    disabled={!formData.related_to_type}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        related_to_id: e.target.value,
                        phase_id: "",
                      })
                    }
                  >
                    <option value="">None</option>
                    {visibleRelatedRecords.map(record => (
                      <option key={record.id} value={record.id}>
                        {record.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {formData.related_to_type === "project" && formData.related_to_id ? (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-on-surface">
                      Phase
                    </label>
                    <Select
                      variant="box"
                      value={formData.phase_id}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          phase_id: e.target.value,
                        })
                      }
                    >
                      <option value="">No phase</option>
                      {visibleProjectPhases.map(phase => (
                        <option key={phase.id} value={phase.id}>
                          {phase.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  Notes
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
                  "Create Task"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
