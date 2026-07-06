import {
  Users,
  Church as ChurchIcon,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  ListTodo,
  BookOpen,
  Bell,
  CheckSquare,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { getTransactionDateRange } from "@/lib/date-ranges";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function Dashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { start: monthStart, end: monthEnd } =
    getTransactionDateRange("month");
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
    supabase.from("donors").select("*", { count: "exact", head: true }),
    supabase.from("churches").select("*", { count: "exact", head: true }),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "Active"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .lt("due_date", today)
      .neq("status", "Completed")
      .neq("status", "Cancelled"),
    supabase.from("budget_entries").select("raised, needed"),
    supabase
      .from("donors")
      .select("id, name, engagement_score")
      .lt("engagement_score", lowEngagementThreshold)
      .order("engagement_score", { ascending: true })
      .order("name", { ascending: true })
      .limit(10),
    supabase
      .from("tasks")
      .select("id, title, due_date, priority, status")
      .neq("status", "Completed")
      .neq("status", "Cancelled")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
    supabase
      .from("resource_transactions")
      .select("quantity, type, amount")
      .lte("transaction_date", monthEnd.toISOString())
      .gte("transaction_date", monthStart!.toISOString()),
  ]);

  const [
    remindersTasksResult,
    remindersDonorsResult,
    remindersChurchesResult,
    remindersLanguageSchoolsResult,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_date, priority")
      .lte("due_date", today)
      .neq("status", "Completed")
      .neq("status", "Cancelled"),
    supabase
      .from("donors")
      .select("id, name, next_follow_up_date")
      .lte("next_follow_up_date", today)
      .not("next_follow_up_date", "is", null),
    supabase
      .from("churches")
      .select("id, name, next_visit_date")
      .lte("next_visit_date", today)
      .not("next_visit_date", "is", null),
    supabase
      .from("language_schools")
      .select("id, name, next_follow_up_date")
      .lte("next_follow_up_date", today)
      .not("next_follow_up_date", "is", null),
  ]);

  const totalDonors = donorsResult.count ?? 0;
  const totalChurches = churchesResult.count ?? 0;
  const activeProjects = projectsResult.count ?? 0;
  const overdueTaskCount = overdueTasksResult.count ?? 0;

  const budgetRows = (budgetResult.data ?? []) as {
    raised: number;
    needed: number;
  }[];
  const totalNeeded = budgetRows.reduce(
    (acc, entry) => acc + Number(entry.needed || 0),
    0,
  );
  const totalRaised = budgetRows.reduce(
    (acc, entry) => acc + Number(entry.raised || 0),
    0,
  );
  const budgetProgress =
    totalNeeded > 0 ? Math.round((totalRaised / totalNeeded) * 100) : 0;

  const inventoryStats = (
    (inventoryResult.data ?? []) as {
      quantity: number;
      type: string;
      amount: number | null;
    }[]
  ).reduce(
    (acc, transaction) => {
      if (transaction.type === "sale") {
        acc.booksSold += Number(transaction.quantity || 0);
        acc.revenue += Number(transaction.amount || 0);
      } else if (transaction.type === "giveaway") {
        acc.booksGivenAway += Number(transaction.quantity || 0);
      }
      return acc;
    },
    { booksSold: 0, revenue: 0, booksGivenAway: 0 },
  );

  type LowEngagementDonor = {
    id: string;
    name: string;
    engagement_score: number;
  };
  const lowEngagementDonors = (lowEngagementResult.data ??
    []) as LowEngagementDonor[];

  type TaskRow = {
    id: string;
    title: string;
    due_date: string | null;
    priority: string;
    status: string;
  };
  const upcomingTasks = (upcomingTasksResult.data ?? []) as TaskRow[];

  type ReminderItem = {
    type: "task" | "donor" | "church" | "language_school";
    id: string;
    label: string;
    dueDate: string;
    href: string;
  };

  const reminderTypeConfig: Record<
    ReminderItem["type"],
    { label: string; icon: typeof Users; accent: string; action: string }
  > = {
    task: {
      label: "Task",
      icon: CheckSquare,
      accent: "text-blue-700 bg-blue-100 border-blue-200",
      action: "Review task",
    },
    donor: {
      label: "Donor",
      icon: Users,
      accent: "text-primary bg-primary-container/10 border-primary-container/20",
      action: "Plan follow-up",
    },
    church: {
      label: "Church",
      icon: ChurchIcon,
      accent: "text-green-800 bg-green-100 border-green-200",
      action: "Plan visit",
    },
    language_school: {
      label: "Language School",
      icon: GraduationCap,
      accent: "text-amber-700 bg-amber-50 border-amber-200",
      action: "Log contact",
    },
  };

  const reminderTasks = (remindersTasksResult.data ?? []) as {
    id: string;
    title: string;
    due_date: string;
    priority: string;
  }[];
  const reminderDonors = (remindersDonorsResult.data ?? []) as {
    id: string;
    name: string;
    next_follow_up_date: string;
  }[];
  const reminderChurches = (remindersChurchesResult.data ?? []) as {
    id: string;
    name: string;
    next_visit_date: string;
  }[];
  const reminderLanguageSchools = (remindersLanguageSchoolsResult.data ??
    []) as {
    id: string;
    name: string;
    next_follow_up_date: string;
  }[];

  const reminders: ReminderItem[] = [
    ...reminderTasks.map((task) => ({
      type: "task" as const,
      id: task.id,
      label: task.title,
      dueDate: task.due_date,
      href: `/tasks/${task.id}`,
    })),
    ...reminderDonors.map((donor) => ({
      type: "donor" as const,
      id: donor.id,
      label: `Follow up with ${donor.name}`,
      dueDate: donor.next_follow_up_date,
      href: `/donors/${donor.id}`,
    })),
    ...reminderChurches.map((church) => ({
      type: "church" as const,
      id: church.id,
      label: `Follow up with ${church.name}`,
      dueDate: church.next_visit_date,
      href: `/churches/${church.id}`,
    })),
    ...reminderLanguageSchools.map((school) => ({
      type: "language_school" as const,
      id: school.id,
      label: `Follow up with ${school.name}`,
      dueDate: school.next_follow_up_date,
      href: `/language-schools/${school.id}`,
    })),
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  function reminderDueLabel(dueDate: string) {
    const days = Math.round(
      (new Date(today).getTime() -
        new Date(dueDate.slice(0, 10)).getTime()) /
        86400000,
    );
    if (days <= 0) return "Due today";
    return `${days} day${days === 1 ? "" : "s"} overdue`;
  }

  const stats = [
    { label: "Total Donors", value: totalDonors, icon: Users },
    { label: "Churches", value: totalChurches, icon: ChurchIcon },
    { label: "Active Projects", value: activeProjects, icon: Briefcase },
    {
      label: "Budget Progress",
      value: `${budgetProgress}%`,
      icon: TrendingUp,
      progress: budgetProgress,
    },
    { label: "Overdue Tasks", value: overdueTaskCount, icon: ListTodo },
  ];

  return (
    <div className="space-y-stack-lg">
      <section className="space-y-3">
        <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
          Mission Pulse
        </p>
        <div className="max-w-3xl space-y-2">
          <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
            Good morning, Director
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Your mission efforts are reaching far today. Here is the mission
            pulse for Light in the East operations.
          </p>
        </div>
      </section>

      <section
        aria-label="Mission metrics"
        className="grid grid-cols-1 gap-cs-md sm:grid-cols-2 lg:grid-cols-5"
      >
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            progress={stat.progress}
          />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <main className="lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <Card.Header>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-headline text-headline-md text-on-surface">
                    Today&apos;s Attention Registry
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Follow-up work already due or queued next.
                  </p>
                </div>
              </div>
            </Card.Header>

            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr] border-b border-outline-variant/15 px-6 py-3 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                  <span>Item</span>
                  <span>Attention Reason</span>
                  <span>Next Step</span>
                  <span>Due</span>
                </div>

                <section>
                  <h3 className="px-6 pt-5 pb-2 text-label-sm font-semibold uppercase tracking-wider text-primary">
                    Overdue / Due Today
                  </h3>
                  <div>
                    {reminders.length === 0 ? (
                      <p className="px-6 py-5 text-sm text-on-surface-variant">
                        Nothing due right now.
                      </p>
                    ) : (
                      reminders.map((reminder) => {
                        const config = reminderTypeConfig[reminder.type];

                        return (
                          <div
                            key={`${reminder.type}-${reminder.id}`}
                            className="grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr] items-center border-t border-outline-variant/10 px-6 py-4 transition-colors hover:bg-primary-container/5"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-lg border",
                                  config.accent,
                                )}
                              >
                                <config.icon className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <Link
                                  href={reminder.href}
                                  className="font-bold text-on-surface hover:text-primary"
                                >
                                  {reminder.label}
                                </Link>
                                <p className="text-xs text-on-surface-variant">
                                  {config.label}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-on-surface-variant">
                              {reminderDueLabel(reminder.dueDate)}
                            </p>
                            <Link
                              href={reminder.href}
                              className="inline-flex w-fit items-center rounded-lg border border-primary px-3 py-1.5 text-label-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                            >
                              {config.action}
                            </Link>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-on-surface">
                                {formatDate(reminder.dueDate)}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                                {reminderDueLabel(reminder.dueDate)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                <section className="border-t border-outline-variant/15">
                  <h3 className="px-6 pt-5 pb-2 text-label-sm font-semibold uppercase tracking-wider text-primary">
                    Upcoming
                  </h3>
                  <div>
                    {upcomingTasks.length === 0 ? (
                      <p className="px-6 py-5 text-sm text-on-surface-variant">
                        No pending tasks.
                      </p>
                    ) : (
                      upcomingTasks.map((task) => (
                        <div
                          key={task.id}
                          className="grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr] items-center border-t border-outline-variant/10 px-6 py-4 transition-colors hover:bg-primary-container/5"
                        >
                          <div className="min-w-0">
                            <Link
                              href={`/tasks/${task.id}`}
                              className="font-bold text-on-surface hover:text-primary"
                            >
                              {task.title}
                            </Link>
                            <p className="text-xs text-on-surface-variant">
                              Task
                            </p>
                          </div>
                          <p className="text-sm text-on-surface-variant">
                            Task scheduled
                          </p>
                          <Link
                            href={`/tasks/${task.id}`}
                            className="inline-flex w-fit items-center rounded-lg border border-primary px-3 py-1.5 text-label-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                          >
                            Review task
                          </Link>
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-sm font-medium text-on-surface">
                              {formatDate(task.due_date)}
                            </span>
                            <Badge
                              variant={
                                task.priority === "High" ? "error" : "info"
                              }
                              className="px-2 py-0.5 text-[10px]"
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>

            <Card.Footer>
              <Link
                href="/tasks"
                className="text-sm font-semibold text-primary hover:underline"
              >
                View all tasks
              </Link>
            </Card.Footer>
          </Card>
        </main>

        <aside className="space-y-gutter">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-on-surface">
                Engagement Needs Attention
              </h2>
            </div>

            <div className="space-y-3">
              {lowEngagementDonors.length === 0 ? (
                <p className="rounded-lg border border-outline-variant/15 bg-surface px-4 py-5 text-sm text-on-surface-variant">
                  No donors are below the engagement threshold right now.
                </p>
              ) : (
                lowEngagementDonors.map((donor) => (
                  <Link
                    key={donor.id}
                    href={`/donors/${donor.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/20 bg-surface p-3 shadow-sm transition-colors hover:bg-primary-container/5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/10 text-sm font-bold text-primary">
                        {getInitials(donor.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-label-md font-bold text-on-surface">
                          {donor.name}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          Score below {lowEngagementThreshold}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="error"
                      className="shrink-0 px-2 py-1 text-[10px]"
                    >
                      {donor.engagement_score}/100
                    </Badge>
                  </Link>
                ))
              )}
            </div>

            <Link
              href="/donors"
              className="inline-flex text-label-sm font-bold text-primary hover:underline"
            >
              View all donors
            </Link>
          </Card>

          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-on-surface">
                Book Distribution Metrics
              </h2>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-outline-variant/20 bg-surface p-3 shadow-sm">
                <p className="text-label-sm font-medium uppercase tracking-wider text-on-surface-variant">
                  Sold
                </p>
                <p className="font-headline text-[20px] font-bold tabular-nums text-on-surface">
                  {inventoryStats.booksSold.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-outline-variant/20 bg-surface p-3 shadow-sm">
                <p className="text-label-sm font-medium uppercase tracking-wider text-on-surface-variant">
                  Given
                </p>
                <p className="font-headline text-[20px] font-bold tabular-nums text-on-surface">
                  {inventoryStats.booksGivenAway.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border border-primary-container/20 bg-primary-container/5 p-3 shadow-sm">
                <p className="text-label-sm font-medium uppercase tracking-wider text-primary">
                  Revenue
                </p>
                <p className="font-headline text-[20px] font-bold tabular-nums text-primary">
                  {formatMoney(inventoryStats.revenue)}
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <section className="relative overflow-hidden rounded-xl border border-primary-container/10 bg-primary-container/5 p-stack-lg text-center">
        <div className="absolute top-0 left-0 h-1 w-full bg-primary-container" />
        <div className="relative mx-auto max-w-4xl py-6">
          <span
            aria-hidden="true"
            className="absolute -top-4 -left-4 font-headline text-[64px] leading-none text-primary opacity-20"
          >
            &ldquo;
          </span>
          <p className="mb-3 font-headline text-[28px] italic leading-tight text-primary">
            The Lord is my light and my salvation; whom shall I fear?
          </p>
          <p className="text-label-md font-bold uppercase tracking-widest text-primary/70">
            Psalm 27:1
          </p>
        </div>
      </section>
    </div>
  );
}
