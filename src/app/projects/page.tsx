"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Search, Plus, Filter, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

type ProjectStatus = 'Idea' | 'Planning' | 'Active' | 'Waiting' | 'Completed' | 'Cancelled';

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
  return Math.min(100, Math.round((project.current_funding / project.budget_needed) * 100));
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
          .from('projects')
          .select('*')
          .order('name');

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

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-zinc-500">Track ministry projects, funding, and budgets.</p>
        </div>
        <Link href="/projects/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Project
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-zinc-900 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="mt-4 text-zinc-500">Loading projects...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-600">Error loading projects: {error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-red-700 underline">Try again</button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-zinc-500">No projects found.</p>
          {searchTerm && <button onClick={() => setSearchTerm("")} className="mt-2 text-blue-600 hover:underline">Clear search</button>}
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b dark:bg-zinc-800/50 dark:border-zinc-800 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Funding</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-zinc-800">
              {filteredProjects.map((project) => {
                const fundingPercent = getFundingPercent(project);

                return (
                  <tr key={project.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <Link href={`/projects/${project.id}`} className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline">
                          {project.name}
                        </Link>
                        <p className="text-zinc-500 text-xs line-clamp-1">{project.goal_description || project.description || "No description provided"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">${project.current_funding.toLocaleString()}</span>
                          <span className="text-zinc-500">of ${project.budget_needed.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${fundingPercent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-zinc-500">
                        <p>Start: {project.start_date || "Not set"}</p>
                        <p>End: {project.end_date || "Not set"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline font-medium">View</Link>
                    </td>
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
