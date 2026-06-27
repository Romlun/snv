import {
  Users,
  Church as ChurchIcon,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  Clock
} from "lucide-react";
import { donors, churches, projects, tasks, budgetEntries } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Dashboard() {
  const totalDonors = donors.length;
  const totalChurches = churches.length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const coolingDonors = donors.filter(d => d.engagementScore < 50);
  const pendingTasks = tasks.filter(t => t.status !== 'Completed');

  const totalNeeded = budgetEntries.reduce((acc, curr) => acc + curr.needed, 0);
  const totalRaised = budgetEntries.reduce((acc, curr) => acc + curr.raised, 0);
  const budgetProgress = Math.round((totalRaised / totalNeeded) * 100);

  const stats = [
    { name: 'Total Donors', value: totalDonors, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Churches', value: totalChurches, icon: ChurchIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Active Projects', value: activeProjects, icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Budget Progress', value: `${budgetProgress}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-zinc-500">Welcome back. Here is what is happening with the mission.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl border dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">{stat.name}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Cooling Off List */}
        <div className="bg-white rounded-xl border overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold">Relationship Alert: Cooling Off</h2>
          </div>
          <div className="divide-y dark:divide-zinc-800">
            {coolingDonors.map((donor) => (
              <div key={donor.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div>
                  <Link href={`/donors/${donor.id}`} className="font-medium hover:underline">{donor.name}</Link>
                  <p className="text-sm text-zinc-500">Last contact: {donor.lastContactDate}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800">
                    Score: {donor.engagementScore}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t dark:border-zinc-800">
            <Link href="/donors" className="text-sm text-blue-600 font-medium hover:underline">View all donors</Link>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl border overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold">Upcoming Tasks</h2>
          </div>
          <div className="divide-y dark:divide-zinc-800">
            {pendingTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-zinc-500">Due: {task.dueDate}</p>
                </div>
                <div>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    task.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  )}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t dark:border-zinc-800">
            <Link href="/tasks" className="text-sm text-blue-600 font-medium hover:underline">View all tasks</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
