import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { Activity } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-strava-orange text-white shadow-lg">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Strava Tracker</h1>
          <p className="text-muted-foreground text-sm">
            Lacak, analisis, dan tingkatkan performa olahraga kamu
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { icon: "📊", label: "Dashboard & Grafik" },
            { icon: "🎯", label: "Target & Progress" },
            { icon: "🏅", label: "Badge & Pencapaian" },
            { icon: "📅", label: "Kalender Aktivitas" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 p-3 rounded-lg bg-card border">
              <span>{f.icon}</span>
              <span className="font-medium">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Login Button */}
        <form
          action={async () => {
            "use server";
            await signIn("strava", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#FC4C02" }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Masuk dengan Strava
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Dengan masuk, kamu menyetujui penggunaan data Strava kamu untuk menampilkan statistik aktivitas.
        </p>
      </div>
    </div>
  );
}
