"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { format } from "date-fns";

const ACTIVITY_TYPES = ["Run", "Ride", "Swim", "Walk", "Hike", "WeightTraining", "Other"];
const PERIODS = [
  { value: "WEEKLY", label: "Mingguan" },
  { value: "MONTHLY", label: "Bulanan" },
  { value: "YEARLY", label: "Tahunan" },
  { value: "CUSTOM", label: "Custom" },
];
const GOAL_TYPES = [
  { value: "DISTANCE", label: "Jarak (km)" },
  { value: "DURATION", label: "Durasi (jam)" },
  { value: "COUNT", label: "Jumlah Aktivitas" },
  { value: "ELEVATION", label: "Elevasi (m)" },
];

export function CreateGoalForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const today = format(new Date(), "yyyy-MM-dd");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());

    // Compute dates from period
    const now = new Date();
    let startDate = body.startDate as string;
    let endDate = body.endDate as string;
    if (body.period === "WEEKLY") {
      const d = new Date(now); d.setDate(d.getDate() - d.getDay() + 1);
      startDate = format(d, "yyyy-MM-dd");
      const e2 = new Date(d); e2.setDate(e2.getDate() + 6);
      endDate = format(e2, "yyyy-MM-dd");
    } else if (body.period === "MONTHLY") {
      startDate = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
      endDate = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");
    } else if (body.period === "YEARLY") {
      startDate = `${now.getFullYear()}-01-01`;
      endDate = `${now.getFullYear()}-12-31`;
    }

    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, startDate, endDate, target: parseFloat(body.target as string) }),
    });

    setLoading(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
        <Plus className="w-4 h-4" /> Buat Target
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Buat Target Baru</h2>
              <button onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="title" placeholder="Nama target" required className="w-full px-3 py-2 text-sm rounded-lg border bg-background" />
              <select name="type" required className="w-full px-3 py-2 text-sm rounded-lg border bg-background">
                {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input name="target" type="number" step="0.1" min="0" placeholder="Target angka" required className="w-full px-3 py-2 text-sm rounded-lg border bg-background" />
              <select name="activityType" className="w-full px-3 py-2 text-sm rounded-lg border bg-background">
                <option value="">Semua tipe aktivitas</option>
                {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select name="period" required className="w-full px-3 py-2 text-sm rounded-lg border bg-background">
                {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Mulai</label>
                  <input name="startDate" type="date" defaultValue={today} className="w-full px-3 py-2 text-sm rounded-lg border bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Selesai</label>
                  <input name="endDate" type="date" defaultValue={today} className="w-full px-3 py-2 text-sm rounded-lg border bg-background" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
                {loading ? "Menyimpan..." : "Simpan Target"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
