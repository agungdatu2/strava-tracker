"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, LayoutDashboard, Activity, Target, Calendar, Lightbulb, Award } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/activities", label: "Aktivitas", icon: Activity },
  { href: "/dashboard/goals",      label: "Target",    icon: Target },
  { href: "/dashboard/calendar",   label: "Kalender",  icon: Calendar },
  { href: "/dashboard/insights",   label: "Insight",   icon: Lightbulb },
  { href: "/dashboard/badges",     label: "Badge",     icon: Award },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(null);
  }, [pathname]);

  function handleClick(href: string) {
    if (href !== pathname) setLoading(href);
    router.push(href);
  }

  return (
    <nav className="flex-1 p-3 space-y-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        const isLoading = loading === href;
        return (
          <button
            key={href}
            onClick={() => handleClick(href)}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              : <Icon className="w-4 h-4 shrink-0" />
            }
            {label}
          </button>
        );
      })}
    </nav>
  );
}
