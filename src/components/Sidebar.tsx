"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Church,
  GraduationCap,
  Briefcase,
  CheckSquare,
  ClipboardList,
  BookOpen,
  Wallet,
  Calendar,
  Settings,
  LogOut,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type NavigationItem = {
  name: string;
  shortName?: string;
  href: string;
  icon: LucideIcon;
};

const navigation: NavigationItem[] = [
  { name: "Dashboard", shortName: "Home", href: "/", icon: LayoutDashboard },
  { name: "Donors", href: "/donors", icon: Users },
  { name: "Churches", href: "/churches", icon: Church },
  { name: "Language Schools", href: "/language-schools", icon: GraduationCap },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Planner", href: "/planner", icon: ClipboardList },
  { name: "Prayers", href: "/prayers", icon: HeartHandshake },
  { name: "Inventory", href: "/inventory", icon: BookOpen },
  { name: "Budget", href: "/budget", icon: Wallet },
  { name: "Calendar", href: "/calendar", icon: Calendar },
];

const mobileNavigation = navigation.filter((item) =>
  ["/", "/donors", "/tasks", "/budget"].includes(item.href),
);

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function LogoLockup() {
  return (
    <Link
      href="/"
      className="focus-ring flex min-w-0 items-center gap-3 rounded-lg"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface shadow-sm ring-1 ring-outline-variant/15">
        <Image
          src="/logo-mark.png"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          priority
        />
      </span>
      <span className="min-w-0 font-headline text-[22px] font-semibold leading-tight text-on-surface">
        Light in the East
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-outline-variant/15 bg-paper-neutral lg:flex">
      <div className="border-b border-outline-variant/15 px-5 py-5">
        <LogoLockup />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
        {navigation.map((item) => {
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-surface-container-high text-primary"
                  : "text-secondary hover:bg-surface-container hover:text-primary",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-outline-variant/15 p-4">
        <Link
          href="/settings"
          className={cn(
            "focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
            isActivePath(pathname, "/settings")
              ? "bg-surface-container-high text-primary"
              : "text-secondary hover:bg-surface-container hover:text-primary",
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-surface-container hover:text-primary"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/15 bg-surface/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_-16px_rgba(17,28,45,0.24)] backdrop-blur-md lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {mobileNavigation.map((item) => {
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-semibold leading-none transition-colors",
                isActive
                  ? "bg-surface-container-high text-primary"
                  : "text-secondary hover:bg-surface-container hover:text-primary",
              )}
              aria-label={item.name}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.shortName ?? item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
