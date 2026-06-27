"use client";

import { User, Bell, Lock, Globe, Database } from "lucide-react";

export default function SettingsPage() {
  const sections = [
    { name: 'Profile', icon: User, desc: 'Manage your personal information and preferences.' },
    { name: 'Notifications', icon: Bell, desc: 'Configure how you receive alerts and reminders.' },
    { name: 'Security', icon: Lock, desc: 'Update your password and account security settings.' },
    { name: 'Organization', icon: Globe, desc: 'Manage mission organization details and roles.' },
    { name: 'Data Management', icon: Database, desc: 'Import, export, and backup your CRM data.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-zinc-500">Manage your account and CRM configuration.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sections.map((section) => (
          <div key={section.name} className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800 flex items-center justify-between hover:border-blue-500 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                <section.icon className="h-6 w-6 text-zinc-500 group-hover:text-blue-600 transition-colors" />
              </div>
              <div>
                <h2 className="font-bold">{section.name}</h2>
                <p className="text-sm text-zinc-500">{section.desc}</p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800">
              →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
