"use client";

import { projects } from "@/lib/mock-data";
import { Plus, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-zinc-500">Mission initiatives, fundraising campaigns, and goals.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {projects.map((project) => {
          const progress = Math.round((project.currentFunding / project.budgetNeeded) * 100);

          return (
            <div key={project.id} className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{project.name}</h2>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-bold uppercase",
                        project.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      )}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-zinc-500">{project.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Goal</p>
                      <p className="font-semibold text-sm">{project.goal}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Funding Progress</span>
                      <span className="font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                      <span>Raised: ${project.currentFunding.toLocaleString()}</span>
                      <span>Target: ${project.budgetNeeded.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-l pl-8 dark:border-zinc-800">
                    <div className="space-y-1">
                       <div className="flex items-center gap-1 text-zinc-500">
                         <Calendar className="h-3.5 w-3.5" />
                         <span className="text-[10px] font-bold uppercase tracking-wider">Started</span>
                       </div>
                       <p className="text-sm font-medium">{project.startDate}</p>
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-1 text-zinc-500">
                         <Users className="h-3.5 w-3.5" />
                         <span className="text-[10px] font-bold uppercase tracking-wider">Team</span>
                       </div>
                       <p className="text-sm font-medium">{project.assignedStaffIds.length} members</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-50 border-t px-6 py-3 dark:bg-zinc-800/30 dark:border-zinc-800 flex justify-between items-center">
                 <div className="flex gap-2">
                   {project.tags.map(tag => (
                     <span key={tag} className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded uppercase">{tag}</span>
                   ))}
                 </div>
                 <button className="text-sm font-bold text-blue-600 hover:underline">Manage Project</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
