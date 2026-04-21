import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/lib/auth";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { SyncButton } from "@/components/shared/SyncButton";
import { DbSync } from "@/components/shared/DbSync";
import {
  LayoutDashboard, Activity, Target, Calendar,
  Lightbulb, Award, LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/activities", label: "Aktivitas", icon: Activity },
  { href: "/dashboard/goals",      label: "Target",    icon: Target },
  { href: "/dashboard/calendar",   label: "Kalender",  icon: Calendar },
  { href: "/dashboard/insights",   label: "Insight",   icon: Lightbulb },
  { href: "/dashboard/badges",     label: "Badge",     icon: Award },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as {
    name?: string | null;
    image?: string | null;
    stravaId?: string;
    needsDbSync?: boolean;
  };

  return (
    <div className="min-h-screen flex">
      {/* Sync user ke DB jika baru login */}
      <DbSync needsSync={user.needsDbSync ?? false} />

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r bg-card">
        <div className="flex items-center gap-2 px-4 py-5 border-b">
          <div className="w-7 h-7 rounded-lg bg-strava-orange flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm">Strava Tracker</span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t space-y-2">
          <div className="flex items-center gap-2 px-3 py-2">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={28} height={28}
                className="rounded-full"
              />
            )}
            <span className="text-xs font-medium truncate">{user.name}</span>
          </div>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}>
            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-6 h-6 rounded-md bg-strava-orange flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Strava Tracker</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <SyncButton />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
