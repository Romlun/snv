"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

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

export default function DateField({ value, onChange, label, required }: Props) {
  const [rawText, setRawText] = useState(() => isoToUs(value));
  const textRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
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

  function handleText(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setRawText(text);
    const iso = usToIso(text);
    lastEmitted.current = iso;
    onChange(iso);
  }

  function handlePicker(e: React.ChangeEvent<HTMLInputElement>) {
    const iso = e.target.value;
    lastEmitted.current = iso;
    setRawText(isoToUs(iso));
    onChange(iso);
  }

  const incomplete = rawText !== "" && usToIso(rawText) === "";

  return (
    <div className="space-y-2">
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
          onClick={() => pickerRef.current?.showPicker?.()}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label="Open date picker"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
        <input
          ref={pickerRef}
          type="date"
          value={value}
          onChange={handlePicker}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      </div>
      {incomplete && (
        <p className="text-xs text-amber-600 mt-1">Enter date as MM/DD/YYYY</p>
      )}
    </div>
  );
}
