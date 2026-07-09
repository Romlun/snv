"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Users,
  Church as ChurchIcon,
  GraduationCap,
  Plus,
  Loader2,
} from "lucide-react";
import {
  addDays,
  addWeeks,
  addMonths,
  addQuarters,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  getQuarter,
  format,
  parse,
  isWithinInterval,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import DateField from "@/components/DateField";
import TaskCompleteToggle from "@/components/TaskCompleteToggle";

type ViewMode = "day" | "week" | "month" | "quarter";
type PlannerItemType = "task" | "donor" | "church" | "language_school";
type TaskPriority = "Low" | "Medium" | "High";

interface PlannerItem {
  type: PlannerItemType;
  id: string;
  label: string;
  date: string;
  href: string;
  priority?: string;
  due_time?: string | null;
  status?: string;
}

interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
  status: string;
  priority: string;
}

interface RelatedRow {
  id: string;
  name: string;
}

interface QuickAddForm {
  title: string;
  due_date: string;
  due_time: string;
  priority: TaskPriority;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
];

const priorities: TaskPriority[] = ["Low", "Medium", "High"];

const plannerTypeConfig: Record<
  PlannerItemType,
  { label: string; icon: typeof Users; accent: string }
> = {
  task: {
    label: "Task",
    icon: CheckSquare,
    accent: "text-blue-700 bg-blue-100 border-blue-200",
  },
  donor: {
    label: "Donor",
    icon: Users,
    accent: "text-primary bg-primary-container/10 border-primary-container/20",
  },
  church: {
    label: "Church",
    icon: ChurchIcon,
    accent: "text-green-800 bg-green-100 border-green-200",
  },
  language_school: {
    label: "Language School",
    icon: GraduationCap,
    accent: "text-amber-700 bg-amber-50 border-amber-200",
  },
};

const emptyStateCopy: Record<ViewMode, string> = {
  day: "Nothing planned for this day.",
  week: "Nothing planned for this week.",
  month: "Nothing planned for this month.",
  quarter: "Nothing planned for this quarter.",
};

function normalizeDate(value: string): string {
  return value.slice(0, 10);
}

function formatDueTime(due_time: string | null): string {
  if (!due_time) return "";
  const [h, m] = due_time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return ` at ${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function todayIso() {
  return format(new Date(), "yyyy-MM-dd");
}

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

function getRange(view: ViewMode, anchor: Date): { start: Date; end: Date } {
  switch (view) {
    case "day":
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    case "week":
      return {
        start: startOfWeek(anchor, { weekStartsOn: 1 }),
        end: endOfWeek(anchor, { weekStartsOn: 1 }),
      };
    case "month":
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
    case "quarter":
      return { start: startOfQuarter(anchor), end: endOfQuarter(anchor) };
  }
}

function stepAnchor(view: ViewMode, anchor: Date, direction: 1 | -1): Date {
  switch (view) {
    case "day":
      return addDays(anchor, direction);
    case "week":
      return addWeeks(anchor, direction);
    case "month":
      return addMonths(anchor, direction);
    case "quarter":
      return addQuarters(anchor, direction);
  }
}

function rangeLabel(view: ViewMode, range: { start: Date; end: Date }): string {
  switch (view) {
    case "day":
      return format(range.start, "EEEE, MMMM d, yyyy");
    case "week":
      return `${format(range.start, "MMM d")} - ${format(range.end, "MMM d, yyyy")}`;
    case "month":
      return format(range.start, "MMMM yyyy");
    case "quarter":
      return `Q${getQuarter(range.start)} ${format(range.start, "yyyy")}`;
  }
}

function defaultDueDate(view: ViewMode, anchor: Date) {
  return view === "day" ? format(anchor, "yyyy-MM-dd") : todayIso();
}

export default function PlannerPage() {
  const supabase = createClient();
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("day");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState<QuickAddForm>({
    title: "",
    due_date: todayIso(),
    due_time: "",
    priority: "Medium",
  });

  async function fetchPlannerData() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
        return;
      }

      const [tasksResult, donorsResult, churchesResult, schoolsResult] =
        await Promise.all([
          supabase
            .from("tasks")
            .select("id, title, due_date, due_time, status, priority")
            .eq("assigned_to", user.id)
            .neq("status", "Cancelled"),
          supabase
            .from("donors")
            .select("id, name, next_follow_up_date")
            .eq("assigned_staff_id", user.id)
            .not("next_follow_up_date", "is", null),
          supabase
            .from("churches")
            .select("id, name, next_visit_date")
            .eq("assigned_staff_id", user.id)
            .not("next_visit_date", "is", null),
          supabase
            .from("language_schools")
            .select("id, name, next_follow_up_date")
            .eq("assigned_staff_id", user.id)
            .not("next_follow_up_date", "is", null),
        ]);

      const tasks = (tasksResult.data ?? []) as TaskRow[];
      const donors = (donorsResult.data ?? []) as (RelatedRow & {
        next_follow_up_date: string;
      })[];
      const churches = (churchesResult.data ?? []) as (RelatedRow & {
        next_visit_date: string;
      })[];
      const schools = (schoolsResult.data ?? []) as (RelatedRow & {
        next_follow_up_date: string;
      })[];

      const unified: PlannerItem[] = [
        ...tasks
          .filter((task) => task.due_date)
          .map((task) => ({
            type: "task" as const,
            id: task.id,
            label: task.title,
            date: normalizeDate(task.due_date as string),
            href: `/tasks/${task.id}`,
            priority: task.priority,
            due_time: task.due_time,
            status: task.status,
          })),
        ...donors.map((donor) => ({
          type: "donor" as const,
          id: donor.id,
          label: `Follow up with ${donor.name}`,
          date: normalizeDate(donor.next_follow_up_date),
          href: `/donors/${donor.id}`,
        })),
        ...churches.map((church) => ({
          type: "church" as const,
          id: church.id,
          label: `Follow up with ${church.name}`,
          date: normalizeDate(church.next_visit_date),
          href: `/churches/${church.id}`,
        })),
        ...schools.map((school) => ({
          type: "language_school" as const,
          id: school.id,
          label: `Follow up with ${school.name}`,
          date: normalizeDate(school.next_follow_up_date),
          href: `/language-schools/${school.id}`,
        })),
      ];

      setItems(unified);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlannerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const range = useMemo(() => getRange(view, anchorDate), [view, anchorDate]);

  const groupedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (!isWithinInterval(parse(item.date, "yyyy-MM-dd", new Date()), range))
        return false;
      if (item.type === "task" && item.status === "Completed" && view !== "day")
        return false;
      return true;
    });

    const groups = new Map<string, PlannerItem[]>();
    filtered.forEach((item) => {
      const group = groups.get(item.date) ?? [];
      group.push(item);
      groups.set(item.date, group);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dateItems]) => ({
        date,
        items: dateItems.sort((a, b) => {
          const aCompleted = a.type === "task" && a.status === "Completed";
          const bCompleted = b.type === "task" && b.status === "Completed";
          if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
          const aTime = a.due_time ?? null;
          const bTime = b.due_time ?? null;
          if (aTime && bTime) return aTime.localeCompare(bTime);
          if (aTime && !bTime) return -1;
          if (!aTime && bTime) return 1;
          return a.label.localeCompare(b.label);
        }),
      }));
  }, [items, range, view]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTask(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const dueDate = validDateOrNull(quickAddForm.due_date);
      const { error } = await supabase.from("tasks").insert({
        title: quickAddForm.title,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        due_time: quickAddForm.due_time || null,
        assigned_to: user.id,
        status: "Not started",
        priority: quickAddForm.priority,
        created_from_planner: true,
      });

      if (error) throw error;

      await fetchPlannerData();
      setQuickAddForm({
        title: "",
        due_date: defaultDueDate(view, anchorDate),
        due_time: "",
        priority: "Medium",
      });
      setShowQuickAdd(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error adding task");
    } finally {
      setSavingTask(false);
    }
  };

  return (
    <div className="space-y-stack-lg">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
            Personal Planning
          </p>
          <div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Planner
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Your tasks and follow-ups, organized by day, week, month, or
              quarter.
            </p>
          </div>
        </div>
        <Button
          type="button"
          icon={Plus}
          onClick={() => {
            setShowQuickAdd((value) => !value);
            setQuickAddForm({
              title: "",
              due_date: defaultDueDate(view, anchorDate),
              due_time: "",
              priority: "Medium",
            });
          }}
        >
          Add Task
        </Button>
      </section>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-full border border-outline-variant/20 bg-surface p-1.5 shadow-sm">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setView(option.value)}
              className={cn(
                "focus-ring rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                view === option.value
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-primary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-outline-variant/20 bg-surface p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setAnchorDate((current) => stepAnchor(view, current, -1))
            }
            className="focus-ring rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[12rem] px-2 text-center font-headline text-headline-md text-on-surface">
            {rangeLabel(view, range)}
          </span>
          <button
            type="button"
            onClick={() =>
              setAnchorDate((current) => stepAnchor(view, current, 1))
            }
            className="focus-ring rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="mx-1 h-6 w-px bg-outline-variant/30" />
          <button
            type="button"
            onClick={() => setAnchorDate(new Date())}
            className="focus-ring rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-container/5"
          >
            Today
          </button>
        </div>
      </section>

      {showQuickAdd ? (
        <Card>
          <h2 className="mb-4 font-headline text-headline-md text-on-surface">
            Add Task
          </h2>
          <form
            onSubmit={handleQuickAdd}
            className="grid grid-cols-1 gap-4 md:grid-cols-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">
                Title
              </label>
              <Input
                required
                variant="box"
                value={quickAddForm.title}
                onChange={(e) =>
                  setQuickAddForm({ ...quickAddForm, title: e.target.value })
                }
              />
            </div>
            <DateField
              label="Due Date"
              value={quickAddForm.due_date}
              onChange={(val) =>
                setQuickAddForm({ ...quickAddForm, due_date: val })
              }
            />
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">
                Due Time
              </label>
              <Input
                type="time"
                variant="box"
                value={quickAddForm.due_time}
                onChange={(e) =>
                  setQuickAddForm({ ...quickAddForm, due_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">
                Priority
              </label>
              <Select
                variant="box"
                value={quickAddForm.priority}
                onChange={(e) =>
                  setQuickAddForm({
                    ...quickAddForm,
                    priority: e.target.value as TaskPriority,
                  })
                }
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-3 md:col-span-4 sm:flex-row">
              <Button type="submit" disabled={savingTask}>
                {savingTask ? "Adding..." : "Save Task"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowQuickAdd(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card padding="none" className="relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : groupedItems.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-on-surface-variant">
            {emptyStateCopy[view]}
          </p>
        ) : (
          <div>
            {groupedItems.map((group, index) => (
              <section
                key={group.date}
                className={cn(index > 0 && "border-t border-outline-variant/15")}
              >
                <h3 className="px-6 pt-5 pb-2 text-label-sm font-semibold uppercase tracking-wider text-primary">
                  {format(
                    parse(group.date, "yyyy-MM-dd", new Date()),
                    "EEEE, MMMM d",
                  )}
                </h3>
                <div>
                  {group.items.map((item) => {
                    const config = plannerTypeConfig[item.type];
                    const isCompletedTask =
                      item.type === "task" && item.status === "Completed";

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        className={cn(
                          "flex items-center justify-between gap-4 border-t border-outline-variant/10 px-6 py-4 transition-colors hover:bg-primary-container/5",
                          isCompletedTask && "opacity-60",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {item.type === "task" ? (
                            <TaskCompleteToggle
                              taskId={item.id}
                              status={item.status ?? "Not started"}
                              onToggled={fetchPlannerData}
                            />
                          ) : null}
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                              config.accent,
                            )}
                          >
                            <config.icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={item.href}
                              className={cn(
                                "font-bold text-on-surface hover:text-primary",
                                isCompletedTask &&
                                  "text-on-surface-variant line-through",
                              )}
                            >
                              {item.label}
                            </Link>
                            <p className="text-xs text-on-surface-variant">
                              {config.label}
                              {item.type === "task"
                                ? formatDueTime(item.due_time ?? null)
                                : ""}
                            </p>
                          </div>
                        </div>
                        {item.type === "task" && item.priority ? (
                          <Badge
                            variant={item.priority === "High" ? "error" : "info"}
                            className="shrink-0 px-2 py-0.5 text-[10px]"
                          >
                            {item.priority}
                          </Badge>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
