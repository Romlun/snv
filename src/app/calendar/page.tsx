"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type CalendarEventType = "task" | "church_visit" | "project" | "contact_log";

interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  date: string; // yyyy-MM-dd
  title: string;
  subtitle: string;
  href: string;
}

interface TaskRow {
  id: string;
  title: string;
  due_date: string;
  status: string;
  priority: string;
}

interface ChurchVisitRow {
  id: string;
  name: string;
  next_visit_date: string;
}

interface ProjectRow {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
}

interface ContactLogRow {
  id: string;
  contact_date: string;
  type: string;
  donor_id: string | null;
  church_id: string | null;
  donors: { name: string } | { name: string }[] | null;
  churches: { name: string } | { name: string }[] | null;
}

const EVENT_STYLES: Record<CalendarEventType, { dot: string; chip: string; legend: string }> = {
  task: { dot: "bg-blue-500", chip: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", legend: "Task" },
  church_visit: { dot: "bg-purple-500", chip: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", legend: "Church Visit" },
  project: { dot: "bg-green-500", chip: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", legend: "Project Milestone" },
  contact_log: { dot: "bg-zinc-400", chip: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", legend: "Past Contact" },
};

function relatedName(rel: { name: string } | { name: string }[] | null): string | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0]?.name ?? null : rel.name;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);

        const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
        const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
        const monthStartIso = startOfMonth(currentMonth).toISOString();
        const monthEndIso = new Date(endOfMonth(currentMonth).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();

        const [tasksResult, churchesResult, projectsResult, contactLogsResult] = await Promise.all([
          supabase
            .from("tasks")
            .select("id, title, due_date, status, priority")
            .gte("due_date", monthStart)
            .lte("due_date", monthEnd),
          supabase
            .from("churches")
            .select("id, name, next_visit_date")
            .gte("next_visit_date", monthStart)
            .lte("next_visit_date", monthEnd),
          supabase
            .from("projects")
            .select("id, name, start_date, end_date")
            .or(
              `and(start_date.gte.${monthStart},start_date.lte.${monthEnd}),and(end_date.gte.${monthStart},end_date.lte.${monthEnd})`
            ),
          supabase
            .from("contact_logs")
            .select("id, contact_date, type, donor_id, church_id, donors(name), churches(name)")
            .gte("contact_date", monthStartIso)
            .lte("contact_date", monthEndIso),
        ]);

        if (tasksResult.error) throw tasksResult.error;
        if (churchesResult.error) throw churchesResult.error;
        if (projectsResult.error) throw projectsResult.error;
        if (contactLogsResult.error) throw contactLogsResult.error;

        const taskEvents: CalendarEvent[] = ((tasksResult.data ?? []) as TaskRow[]).map((t) => ({
          id: `task-${t.id}`,
          type: "task",
          date: t.due_date,
          title: t.title,
          subtitle: `${t.status} · ${t.priority} priority`,
          href: `/tasks/${t.id}`,
        }));

        const churchEvents: CalendarEvent[] = ((churchesResult.data ?? []) as ChurchVisitRow[]).map((c) => ({
          id: `church-${c.id}`,
          type: "church_visit",
          date: c.next_visit_date,
          title: c.name,
          subtitle: "Planned church visit",
          href: `/churches/${c.id}`,
        }));

        const projectEvents: CalendarEvent[] = [];
        for (const p of (projectsResult.data ?? []) as ProjectRow[]) {
          if (p.start_date && p.start_date >= monthStart && p.start_date <= monthEnd) {
            projectEvents.push({
              id: `project-start-${p.id}`,
              type: "project",
              date: p.start_date,
              title: p.name,
              subtitle: "Project start",
              href: `/projects/${p.id}`,
            });
          }
          if (p.end_date && p.end_date >= monthStart && p.end_date <= monthEnd) {
            projectEvents.push({
              id: `project-end-${p.id}`,
              type: "project",
              date: p.end_date,
              title: p.name,
              subtitle: "Project end",
              href: `/projects/${p.id}`,
            });
          }
        }

        const contactEvents: CalendarEvent[] = ((contactLogsResult.data ?? []) as ContactLogRow[]).map((log) => {
          const donorName = relatedName(log.donors);
          const churchName = relatedName(log.churches);
          const who = donorName ?? churchName ?? "Unknown contact";
          const href = log.donor_id ? `/donors/${log.donor_id}` : log.church_id ? `/churches/${log.church_id}` : "/calendar";
          return {
            id: `contact-${log.id}`,
            type: "contact_log",
            date: format(new Date(log.contact_date), "yyyy-MM-dd"),
            title: who,
            subtitle: `${log.type} · past contact`,
            href,
          };
        });

        setEvents([...taskEvents, ...churchEvents, ...projectEvents, ...contactEvents]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [currentMonth]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-zinc-500">Tasks, church visits, project milestones, and contact history in one view.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2 border rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            className="px-4 py-2 border rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 border rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 font-semibold min-w-[9rem] text-center">{format(currentMonth, "MMMM yyyy")}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
        {(Object.keys(EVENT_STYLES) as CalendarEventType[]).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", EVENT_STYLES[t].dot)} />
            {EVENT_STYLES[t].legend}
          </div>
        ))}
      </div>

      {error ? (
        <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-600">Error loading calendar: {error}</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-zinc-900/60 flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
          )}
          <div className="grid grid-cols-7 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 text-xs font-medium text-zinc-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-3 py-2 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {gridDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate.get(dateKey) ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const visibleEvents = dayEvents.slice(0, 3);
              const extraCount = dayEvents.length - visibleEvents.length;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => dayEvents.length > 0 && setSelectedDate(dateKey)}
                  className={cn(
                    "min-h-[100px] border-b border-r p-2 text-left align-top dark:border-zinc-800 [&:nth-child(7n)]:border-r-0 transition-colors",
                    inMonth ? "bg-white dark:bg-zinc-900" : "bg-zinc-50/50 dark:bg-zinc-950/40",
                    dayEvents.length > 0 && "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      inMonth ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600",
                      isToday(day) && "bg-blue-600 text-white"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {visibleEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn("truncate rounded px-1.5 py-0.5 text-[11px] font-medium", EVENT_STYLES[event.type].chip)}
                      >
                        {event.title}
                      </div>
                    ))}
                    {extraCount > 0 && <div className="text-[11px] font-medium text-zinc-500 px-1.5">+{extraCount} more</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="w-full max-w-md bg-white border rounded-xl dark:bg-zinc-900 dark:border-zinc-800 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b dark:border-zinc-800 flex items-center justify-between">
              <h2 className="font-semibold">{format(new Date(`${selectedDate}T00:00:00`), "EEEE, MMMM d, yyyy")}</h2>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y dark:divide-zinc-800 overflow-y-auto">
              {selectedEvents.length === 0 ? (
                <p className="p-4 text-sm text-zinc-500">Nothing scheduled.</p>
              ) : (
                selectedEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="p-4 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", EVENT_STYLES[event.type].dot)} />
                    <div>
                      <p className="font-medium hover:underline">{event.title}</p>
                      <p className="text-xs text-zinc-500">{event.subtitle}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
