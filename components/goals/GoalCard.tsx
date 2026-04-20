"use client";
import { Goal } from "@prisma/client";
import { formatDate } from "@/lib/utils/format";
import { activityIcon } from "@/lib/utils/format";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type GoalWithProgress = Goal & { current: number; progress: number };

export function GoalCard({ goal }: { goal: GoalWithProgress }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Hapus target ini?")) return;
    await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    router.refresh();
  };

  const displayCurrent = () => {
    if (goal.type === "DISTANCE") return `${goal.current.toFixed(1)} km`;
    if (goal.type === "DURATION") return `${goal.current.toFixed(1)} jam`;
    if (goal.type === "COUNT") return `${Math.round(goal.current)} aktivitas`;
    return `${Math.round(goal.current)} m`;
  };

  const displayTarget = () => {
    if (goal.type === "DISTANCE") return `${goal.target} km`;
    if (goal.type === "DURATION") return `${goal.target} jam`;
    if (goal.type === "COUNT") return `${goal.target} aktivitas`;
    return `${goal.target} m`;
  };

  const isCompleted = goal.progress >= 100;

  return (
    <div className={`rounded-xl border bg-card p-5 space-y-4 ${isCompleted ? "border-green-500/30" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {goal.activityType && <span className="text-xl">{activityIcon(goal.activityType)}</span>}
          <div>
            <p className="font-semibold">{goal.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(goal.startDate)} – {formatDate(goal.endDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full font-medium">✓ Selesai</span>}
          <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{displayCurrent()}</span>
          <span className="font-medium">{displayTarget()}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-green-500" : "bg-primary"}`}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <p className="text-xs text-right text-muted-foreground">{goal.progress.toFixed(1)}%</p>
      </div>
    </div>
  );
}
