"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { DayPicker } from "react-day-picker";

interface Props {
  value: string;
  onChange: (iso: string) => void;
  label: string;
  required?: boolean;
}

function isoToUs(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

function usToIso(us: string): string {
  const match = us.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const [, mo, da, yr] = match;
  const n = { mo: Number(mo), da: Number(da), yr: Number(yr) };
  if (n.mo < 1 || n.mo > 12 || n.da < 1 || n.da > 31 || n.yr < 1900 || n.yr > 2100) return "";
  return `${yr}-${mo}-${da}`;
}

function isoToLocalDate(iso: string): Date | undefined {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined;
  const date = parse(iso, "yyyy-MM-dd", new Date());
  return isValid(date) ? date : undefined;
}

function localDateToIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export default function DateField({ value, onChange, label, required }: Props) {
  const [rawText, setRawText] = useState(() => isoToUs(value));
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const lastEmitted = useRef<string>(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setRawText(isoToUs(value));
      lastEmitted.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (!textRef.current) return;
    if (rawText !== "" && usToIso(rawText) === "") {
      textRef.current.setCustomValidity("Enter date as MM/DD/YYYY");
    } else {
      textRef.current.setCustomValidity("");
    }
  }, [rawText]);

  useEffect(() => {
    function handleOutsideMouseDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
        textRef.current?.blur();
      }
    }

    document.addEventListener("mousedown", handleOutsideMouseDown);
    return () => document.removeEventListener("mousedown", handleOutsideMouseDown);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  function handleText(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setRawText(text);
    const iso = usToIso(text);
    lastEmitted.current = iso;
    onChange(iso);
  }

  function handleSelect(day: Date | undefined) {
    if (!day) return;
    const iso = localDateToIso(day);
    lastEmitted.current = iso;
    setRawText(isoToUs(iso));
    onChange(iso);
    setOpen(false);
  }

  const incomplete = rawText !== "" && usToIso(rawText) === "";
  const selectedDate = isoToLocalDate(value);

  return (
    <div ref={wrapperRef} className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          ref={textRef}
          type="text"
          placeholder="MM/DD/YYYY"
          value={rawText}
          onChange={handleText}
          required={required}
          className="w-full px-3 py-2 pr-9 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label="Open date picker"
          aria-expanded={open}
        >
          <CalendarDays className="h-4 w-4" />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 rounded-lg border bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              defaultMonth={selectedDate}
              classNames={{
                root: "text-sm text-zinc-900 dark:text-zinc-100",
                months: "flex",
                month: "space-y-3",
                month_caption: "flex items-center justify-center px-8",
                caption_label: "text-sm font-semibold",
                nav: "absolute inset-x-3 top-3 flex items-center justify-between",
                button_previous: "inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                button_next: "inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                month_grid: "border-collapse",
                weekdays: "text-zinc-500",
                weekday: "h-8 w-8 text-center text-xs font-medium",
                week: "",
                day: "h-8 w-8 p-0 text-center",
                day_button: "h-8 w-8 rounded-md text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800",
                today: "font-bold text-blue-600 dark:text-blue-400",
                selected: "bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-600 dark:text-white",
                outside: "text-zinc-300 dark:text-zinc-700",
                disabled: "opacity-40",
              }}
            />
          </div>
        )}
      </div>
      {incomplete && (
        <p className="text-xs text-amber-600 mt-1">Enter date as MM/DD/YYYY</p>
      )}
    </div>
  );
}
