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
import { Card } from "@/components/ui/Card";
import { Portal } from "@/components/ui/Portal";

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
  task: {
    dot: "bg-blue-500",
    chip: "border-l-2 border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    legend: "Task",
  },
  church_visit: {
    dot: "bg-purple-500",
    chip: "border-l-2 border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400",
    legend: "Church Visit",
  },
  project: {
    dot: "bg-green-500",
    chip: "border-l-2 border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
    legend: "Project Milestone",
  },
  contact_log: {
    dot: "bg-zinc-400",
    chip: "border-l-2 border-zinc-400 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400",
    legend: "Past Contact",
  },
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
    <div className="space-y-stack-lg">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-label-sm font-semibold uppercase tracking-wider text-primary">
            Scheduling
          </p>
          <div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Calendar
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Tasks, church visits, project milestones, and contact history in one view.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-outline-variant/20 bg-surface p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="focus-ring rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[9rem] px-2 text-center font-headline text-headline-md text-on-surface">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="focus-ring rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="mx-1 h-6 w-px bg-outline-variant/30" />
          <button
            type="button"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            className="focus-ring rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-container/5"
          >
            Today
          </button>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        {(Object.keys(EVENT_STYLES) as CalendarEventType[]).map((t) => (
          <div
            key={t}
            className="flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface px-3 py-1 shadow-sm"
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", EVENT_STYLES[t].dot)} />
            <span className="text-xs font-semibold text-on-surface-variant">
              {EVENT_STYLES[t].legend}
            </span>
          </div>
        ))}
      </section>

      {error ? (
        <Card className="border-red-100 bg-red-50 p-8 text-center">
          <p className="text-red-600">Error loading calendar: {error}</p>
        </Card>
      ) : (
        <Card padding="none" className="relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/60">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <div className="grid grid-cols-7 border-b border-outline-variant/15 bg-surface-container-low text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="border-r border-outline-variant/10 px-3 py-3 text-center last:border-r-0">
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
                    "min-h-[100px] border-b border-r border-outline-variant/10 p-2 text-left align-top transition-colors [&:nth-child(7n)]:border-r-0",
                    inMonth ? "bg-surface" : "bg-surface-container-low/40",
                    dayEvents.length > 0 && "cursor-pointer hover:bg-primary-container/5"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      inMonth ? "text-on-surface" : "text-on-surface-variant/50",
                      isToday(day) && "bg-primary text-on-primary"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {visibleEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn("truncate rounded-sm px-1.5 py-1 text-[11px] font-semibold", EVENT_STYLES[event.type].chip)}
                      >
                        {event.title}
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <div className="px-1.5 text-[11px] font-semibold text-on-surface-variant">
                        +{extraCount} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {selectedDate && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4"
            onClick={() => setSelectedDate(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-outline-variant/20 bg-surface shadow-xl max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-outline-variant/15 p-4">
                <h2 className="font-headline text-headline-md text-on-surface">
                  {format(new Date(`${selectedDate}T00:00:00`), "EEEE, MMMM d, yyyy")}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="focus-ring rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-outline-variant/10 overflow-y-auto">
                {selectedEvents.length === 0 ? (
                  <p className="p-4 text-sm text-on-surface-variant">Nothing scheduled.</p>
                ) : (
                  selectedEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={event.href}
                      className="flex items-start gap-3 p-4 transition-colors hover:bg-primary-container/5"
                    >
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", EVENT_STYLES[event.type].dot)} />
                      <div>
                        <p className="font-semibold text-on-surface hover:underline">{event.title}</p>
                        <p className="text-xs text-on-surface-variant">{event.subtitle}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
