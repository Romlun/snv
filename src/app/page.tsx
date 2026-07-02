import {
  Users,
  Church as ChurchIcon,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  Clock,
  ListTodo,
  BookOpen,
  Bell,
  CheckSquare,
  GraduationCap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTransactionDateRange } from "@/lib/date-ranges";
import { cn } from "@/lib/utils";
import Link from "next/link";

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default async function Dashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const { start: monthStart, end: monthEnd } = getTransactionDateRange('month');
  const lowEngagementThreshold = 40;

  const [
    donorsResult,
    churchesResult,
    projectsResult,
    overdueTasksResult,
    budgetResult,
    lowEngagementResult,
    upcomingTasksResult,
    inventoryResult,
  ] = await Promise.all([
    supabase.from('donors').select('*', { count: 'exact', head: true }),
    supabase.from('churches').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .lt('due_date', today)
      .neq('status', 'Completed')
      .neq('status', 'Cancelled'),
    supabase.from('budget_entries').select('raised, needed'),
    supabase.from('donors')
      .select('id, name, engagement_score')
      .lt('engagement_score', lowEngagementThreshold)
      .order('engagement_score', { ascending: true })
      .order('name', { ascending: true })
      .limit(10),
    supabase.from('tasks')
      .select('id, title, due_date, priority, status')
      .neq('status', 'Completed')
      .neq('status', 'Cancelled')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(5),
    supabase.from('resource_transactions')
      .select('quantity, type, amount')
      .lte('transaction_date', monthEnd.toISOString())
      .gte('transaction_date', monthStart!.toISOString()),
  ]);

  const [
    remindersTasksResult,
    remindersDonorsResult,
    remindersChurchesResult,
    remindersLanguageSchoolsResult,
  ] = await Promise.all([
    supabase.from('tasks')
      .select('id, title, due_date, priority')
      .lte('due_date', today)
      .neq('status', 'Completed')
      .neq('status', 'Cancelled'),
    supabase.from('donors')
      .select('id, name, next_follow_up_date')
      .lte('next_follow_up_date', today)
      .not('next_follow_up_date', 'is', null),
    supabase.from('churches')
      .select('id, name, next_visit_date')
      .lte('next_visit_date', today)
      .not('next_visit_date', 'is', null),
    supabase.from('language_schools')
      .select('id, name, next_follow_up_date')
      .lte('next_follow_up_date', today)
      .not('next_follow_up_date', 'is', null),
  ]);

  const totalDonors = donorsResult.count ?? 0;
  const totalChurches = churchesResult.count ?? 0;
  const activeProjects = projectsResult.count ?? 0;
  const overdueTaskCount = overdueTasksResult.count ?? 0;

  const budgetRows = (budgetResult.data ?? []) as { raised: number; needed: number }[];
  const totalNeeded = budgetRows.reduce((acc, e) => acc + Number(e.needed || 0), 0);
  const totalRaised = budgetRows.reduce((acc, e) => acc + Number(e.raised || 0), 0);
  const budgetProgress = totalNeeded > 0 ? Math.round((totalRaised / totalNeeded) * 100) : 0;

  const inventoryStats = ((inventoryResult.data ?? []) as { quantity: number; type: string; amount: number | null }[]).reduce(
    (acc, t) => {
      if (t.type === 'sale') {
        acc.booksSold += Number(t.quantity || 0);
        acc.revenue += Number(t.amount || 0);
      } else if (t.type === 'giveaway') {
        acc.booksGivenAway += Number(t.quantity || 0);
      }
      return acc;
    },
    { booksSold: 0, revenue: 0, booksGivenAway: 0 }
  );

  type LowEngagementDonor = { id: string; name: string; engagement_score: number };
  const lowEngagementDonors = (lowEngagementResult.data ?? []) as LowEngagementDonor[];

  type TaskRow = { id: string; title: string; due_date: string | null; priority: string; status: string };
  const upcomingTasks = (upcomingTasksResult.data ?? []) as TaskRow[];

  type ReminderItem = {
    type: 'task' | 'donor' | 'church' | 'language_school';
    id: string;
    label: string;
    dueDate: string;
    href: string;
  };

  const reminderTypeConfig: Record<ReminderItem['type'], { label: string; icon: typeof Users; color: string; bg: string }> = {
    task: { label: 'Task', icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    donor: { label: 'Donor', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    church: { label: 'Church', icon: ChurchIcon, color: 'text-green-600', bg: 'bg-green-50' },
    language_school: { label: 'Language School', icon: GraduationCap, color: 'text-orange-600', bg: 'bg-orange-50' },
  };

  const reminderTasks = (remindersTasksResult.data ?? []) as { id: string; title: string; due_date: string; priority: string }[];
  const reminderDonors = (remindersDonorsResult.data ?? []) as { id: string; name: string; next_follow_up_date: string }[];
  const reminderChurches = (remindersChurchesResult.data ?? []) as { id: string; name: string; next_visit_date: string }[];
  const reminderLanguageSchools = (remindersLanguageSchoolsResult.data ?? []) as { id: string; name: string; next_follow_up_date: string }[];

  const reminders: ReminderItem[] = [
    ...reminderTasks.map((t) => ({
      type: 'task' as const,
      id: t.id,
      label: t.title,
      dueDate: t.due_date,
      href: `/tasks/${t.id}`,
    })),
    ...reminderDonors.map((d) => ({
      type: 'donor' as const,
      id: d.id,
      label: `Follow up with ${d.name}`,
      dueDate: d.next_follow_up_date,
      href: `/donors/${d.id}`,
    })),
    ...reminderChurches.map((c) => ({
      type: 'church' as const,
      id: c.id,
      label: `Follow up with ${c.name}`,
      dueDate: c.next_visit_date,
      href: `/churches/${c.id}`,
    })),
    ...reminderLanguageSchools.map((s) => ({
      type: 'language_school' as const,
      id: s.id,
      label: `Follow up with ${s.name}`,
      dueDate: s.next_follow_up_date,
      href: `/language-schools/${s.id}`,
    })),
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  function reminderDueLabel(dueDate: string) {
    const days = Math.round((new Date(today).getTime() - new Date(dueDate.slice(0, 10)).getTime()) / 86400000);
    if (days <= 0) return 'Due today';
    return `${days} day${days === 1 ? '' : 's'} overdue`;
  }

  const stats = [
    { name: 'Total Donors', value: totalDonors, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Churches', value: totalChurches, icon: ChurchIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Active Projects', value: activeProjects, icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Budget Progress', value: `${budgetProgress}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Overdue Tasks', value: overdueTaskCount, icon: ListTodo, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-zinc-500">Welcome back. Here is what is happening with the mission.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      {/* Inventory Snapshot */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-zinc-500" />
          <h2 className="font-semibold">Inventory Snapshot — This Month</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 font-medium">Books Sold</p>
            <p className="text-2xl font-bold">{inventoryStats.booksSold}</p>
          </div>
          <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 font-medium">Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatMoney(inventoryStats.revenue)}</p>
          </div>
          <div className="bg-white border rounded-xl p-4 dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 font-medium">Books Given Away</p>
            <p className="text-2xl font-bold">{inventoryStats.booksGivenAway}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Reminders */}
        <div className="bg-white rounded-xl border overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-500" />
            <h2 className="font-semibold">Reminders</h2>
          </div>
          <div className="divide-y dark:divide-zinc-800">
            {reminders.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">Nothing due right now.</p>
            ) : (
              reminders.map((reminder) => {
                const config = reminderTypeConfig[reminder.type];
                return (
                  <div key={`${reminder.type}-${reminder.id}`} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-1.5 rounded-lg", config.bg)}>
                        <config.icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div>
                        <Link href={reminder.href} className="font-medium hover:underline">{reminder.label}</Link>
                        <p className="text-sm text-zinc-500">{config.label}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400 whitespace-nowrap">{reminderDueLabel(reminder.dueDate)}</span>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 border-t dark:border-zinc-800">
            <Link href="/tasks" className="text-sm text-blue-600 font-medium hover:underline">View all tasks</Link>
          </div>
        </div>

        {/* Engagement Needs Attention */}
        <div className="bg-white rounded-xl border overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold">Engagement Needs Attention</h2>
          </div>
          <div className="divide-y dark:divide-zinc-800">
            {lowEngagementDonors.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">No donors are below the engagement threshold right now.</p>
            ) : (
              lowEngagementDonors.map((donor) => (
                <div key={donor.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div>
                    <Link href={`/donors/${donor.id}`} className="font-medium hover:underline">{donor.name}</Link>
                    <p className="text-sm text-zinc-500">
                      Engagement score is below {lowEngagementThreshold}
                    </p>
                  </div>
                  <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    {donor.engagement_score}/100
                  </div>
                </div>
              ))
            )}
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
            {upcomingTasks.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">No pending tasks.</p>
            ) : (
              upcomingTasks.map((task) => (
                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-zinc-500">Due: {formatDate(task.due_date)}</p>
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
              ))
            )}
          </div>
          <div className="p-4 border-t dark:border-zinc-800">
            <Link href="/tasks" className="text-sm text-blue-600 font-medium hover:underline">View all tasks</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
