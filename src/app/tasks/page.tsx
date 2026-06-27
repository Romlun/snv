"use client";

import { tasks, staff, donors, churches, projects } from "@/lib/mock-data";
import { Plus, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const getRelatedName = (task: typeof tasks[0]) => {
    if (!task.relatedToId) return null;
    if (task.relatedToType === 'donor') return donors.find(d => d.id === task.relatedToId)?.name;
    if (task.relatedToType === 'church') return churches.find(c => c.id === task.relatedToId)?.name;
    if (task.relatedToType === 'project') return projects.find(p => p.id === task.relatedToId)?.name;
    return null;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'Medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks & Actions</h1>
          <p className="text-zinc-500">Track responsibilities and next steps.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => {
          const relatedName = getRelatedName(task);
          const assignedStaff = staff.find(s => s.id === task.assignedTo);

          return (
            <div key={task.id} className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <button className="mt-1 text-zinc-300 hover:text-blue-600 transition-colors">
                  {task.status === 'Completed' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </button>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "font-bold text-lg",
                      task.status === 'Completed' && "line-through text-zinc-400"
                    )}>
                      {task.title}
                    </h3>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                      getPriorityColor(task.priority)
                    )}>
                      {task.priority} Priority
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm">{task.description}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Due: <span className="font-bold">{task.dueDate}</span></span>
                    </div>
                    {relatedName && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Related: <span className="font-bold text-zinc-700 dark:text-zinc-300">{relatedName}</span></span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 ml-auto">
                      <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                        {assignedStaff?.name.charAt(0)}
                      </div>
                      <span>Assigned to <span className="font-bold">{assignedStaff?.name}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
