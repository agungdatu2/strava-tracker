import { getDbUser } from "@/lib/get-db-user";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { GoalCard } from "@/components/goals/GoalCard";
import { CreateGoalForm } from "@/components/goals/CreateGoalForm";

export default async function GoalsPage() {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");
  const userId = dbUser.id;

  const goals = await db.goal.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // Calculate progress for each goal
  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => {
      const now = new Date();
      const where = {
        userId,
        startDate: { gte: goal.startDate, lte: goal.endDate < now ? goal.endDate : now },
        ...(goal.activityType ? { type: goal.activityType } : {}),
      };

      let current = 0;
      if (goal.type === "DISTANCE") {
        const res = await db.activity.aggregate({ where, _sum: { distance: true } });
        current = (res._sum.distance ?? 0) / 1000; // → km
      } else if (goal.type === "DURATION") {
        const res = await db.activity.aggregate({ where, _sum: { movingTime: true } });
        current = (res._sum.movingTime ?? 0) / 3600; // → hours
      } else if (goal.type === "COUNT") {
        current = await db.activity.count({ where });
      } else if (goal.type === "ELEVATION") {
        const res = await db.activity.aggregate({ where, _sum: { totalElevation: true } });
        current = res._sum.totalElevation ?? 0;
      }

      return { ...goal, current, progress: Math.min(100, (current / goal.target) * 100) };
    })
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Target & Progress</h1>
          <p className="text-sm text-muted-foreground">{goals.length} target aktif</p>
        </div>
        <CreateGoalForm />
      </div>

      {goalsWithProgress.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-medium">Belum ada target</p>
          <p className="text-sm">Buat target pertama kamu!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goalsWithProgress.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
