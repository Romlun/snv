"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Filter, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type ProjectStatus =
  | "Idea"
  | "Planning"
  | "Active"
  | "Waiting"
  | "Completed"
  | "Cancelled";

interface Project {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  goal_description: string | null;
  budget_needed: number;
  current_funding: number;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

function getFundingPercent(project: Project) {
  if (!project.budget_needed) return 0;
  return Math.min(
    100,
    Math.round((project.current_funding / project.budget_needed) * 100),
  );
}

function getStatusVariant(status: ProjectStatus) {
  if (status === "Completed") return "success";
  if (status === "Cancelled") return "error";
  if (status === "Waiting") return "warning";
  if (status === "Active") return "primary";
  return "info";
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("name");

        if (error) throw error;
        setProjects(data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [supabase]);

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activeProjects = projects.filter(
    (project) => project.status === "Active",
  ).length;
  const needsFunding = projects.filter(
    (project) =>
      project.status === "Active" &&
      project.current_funding < project.budget_needed,
  ).length;
  const completedProjects = projects.filter(
    (project) => project.status === "Completed",
  ).length;
  const completionRate =
    projects.length > 0
      ? Math.round((completedProjects / projects.length) * 100)
      : 0;

  const metrics = [
    {
      label: "Active Projects",
      value: activeProjects.toLocaleString(),
      detail: "Currently live",
    },
    {
      label: "Needs Funding",
      value: needsFunding.toLocaleString(),
      detail: "Active and below budget",
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      detail: "Completed projects / total",
    },
  ];

  return (
    <div className="space-y-stack-lg">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
            Project Portfolio
          </p>
          <div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Projects
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Track ministry projects, funding, and budgets.
            </p>
          </div>
        </div>
        <Button
          type="button"
          icon={Plus}
          onClick={() => {
            window.location.href = "/projects/new";
          }}
        >
          Add Project
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-cs-md md:grid-cols-3">
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
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/70" />
          <Input
            variant="search"
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-11"
          />
        </div>
        <Button type="button" variant="secondary" icon={Filter}>
          Filters
        </Button>
      </section>

      {loading ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-on-surface-variant">Loading projects...</p>
        </Card>
      ) : error ? (
        <Card className="border-red-100 bg-red-50 p-8 text-center">
          <p className="text-red-600">Error loading projects: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-bold text-red-700 underline"
          >
            Try again
          </button>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <p className="text-on-surface-variant">No projects found.</p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-sm font-semibold text-primary hover:underline"
            >
              Clear search
            </button>
          ) : null}
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-outline-variant/15 bg-surface-container-low text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Funding</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const fundingPercent = getFundingPercent(project);

                  return (
                    <tr
                      key={project.id}
                      className="border-t border-outline-variant/10 transition-colors hover:bg-primary-container/5"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/projects/${project.id}`}
                            className="font-bold text-on-surface hover:text-primary"
                          >
                            {project.name}
                          </Link>
                          <p className="line-clamp-1 text-xs text-on-surface-variant">
                            {project.goal_description ||
                              project.description ||
                              "No description provided"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={getStatusVariant(project.status)}
                          className="px-2 py-0.5 normal-case tracking-normal"
                        >
                          {project.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-4 text-xs">
                            <span className="font-semibold tabular-nums text-on-surface">
                              {formatMoney(project.current_funding)}
                            </span>
                            <span className="tabular-nums text-on-surface-variant">
                              of {formatMoney(project.budget_needed)}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                            <div
                              className="h-full rounded-full bg-primary-container"
                              style={{ width: `${fundingPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-on-surface-variant">
                          <p>Start: {project.start_date || "Not set"}</p>
                          <p>End: {project.end_date || "Not set"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          View
                        </Link>
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
