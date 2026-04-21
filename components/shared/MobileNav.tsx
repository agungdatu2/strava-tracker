"use client";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { LayoutDashboard, Activity, Target, Calendar, Lightbulb, Award, Loader2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/activities", label: "Aktivitas", icon: Activity },
  { href: "/dashboard/goals",      label: "Target",    icon: Target },
  { href: "/dashboard/calendar",   label: "Kalender",  icon: Calendar },
  { href: "/dashboard/insights",   label: "Insight",   icon: Lightbulb },
  { href: "/dashboard/badges",     label: "Badge",     icon: Award },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  function handleClick(href: string) {
    if (href === pathname) return;
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  if (!isPending && pendingHref) setPendingHref(null);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-center justify-around px-2 py-2" style={{ background: "#FC4C02" }}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        const isLoading = isPending && pendingHref === href;
        return (
          <button
            key={href}
            onClick={() => handleClick(href)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
              active ? "text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {isLoading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Icon className="w-5 h-5" />
            }
            <span className={`text-[10px] ${active ? "font-semibold" : ""}`}>{label}</span>
            {active && <span className="w-1 h-1 rounded-full bg-white mt-0.5" />}
          </button>
        );
      })}
    </nav>
  );
}
