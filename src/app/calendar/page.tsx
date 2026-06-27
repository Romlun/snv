"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export default function CalendarPage() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Simple mock month view
  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-zinc-500">Scheduled visits, meetings, and project deadlines.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
        <div className="p-4 border-b dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-bold">June 2025</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b dark:border-zinc-800">
          {days.map(day => (
            <div key={day} className="py-2 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800/50">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map(day => (
            <div key={day} className="h-32 border-r border-b dark:border-zinc-800 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <span className="text-sm font-medium text-zinc-400">{day}</span>
              {day === 15 && (
                <div className="mt-1 px-1.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold rounded truncate">
                  Donor Call: Smith
                </div>
              )}
              {day === 20 && (
                <div className="mt-1 px-1.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-bold rounded truncate">
                  Church Presentation
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
