import "dotenv/config";
import { Worker } from "bullmq";
import { getIORedis } from "@/lib/redis";
import { db } from "@/lib/db";
import { syncActivities, upsertActivity, fetchActivityById } from "@/lib/strava";
import { evaluateBadges } from "@/lib/badges/engine";
import type { SyncJobData } from "./sync.queue";

const worker = new Worker<SyncJobData>(
  "strava-sync",
  async (job) => {
    const { userId, type, stravaActivityId, afterTimestamp } = job.data;

    // Create sync log
    const syncLog = await db.syncLog.create({
      data: { userId, type, status: "RUNNING" },
    });

    try {
      let synced = 0;
      let pages = 0;

      if (type === "WEBHOOK" && stravaActivityId) {
        // Single activity from webhook
        const act = await fetchActivityById(userId, stravaActivityId);
        await upsertActivity(userId, act);
        synced = 1;
        pages = 1;
      } else {
        // Bulk sync
        const result = await syncActivities(
          userId,
          afterTimestamp,
          (count) => job.updateProgress(count)
        );
        synced = result.synced;
        pages = result.pages;
      }

      // Evaluate badges after every sync
      await evaluateBadges(userId);

      await db.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "SUCCESS",
          activitiesSynced: synced,
          pagesProcessed: pages,
          completedAt: new Date(),
        },
      });

      console.log(`[sync] user=${userId} type=${type} synced=${synced} pages=${pages}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db.syncLog.update({
        where: { id: syncLog.id },
        data: { status: "FAILED", error: message, completedAt: new Date() },
      });
      throw err;
    }
  },
  {
    connection: getIORedis(),
    concurrency: 3,
  }
);

worker.on("failed", (job, err) => {
  console.error(`[sync] job ${job?.id} failed: ${err.message}`);
});

worker.on("completed", (job) => {
  console.log(`[sync] job ${job.id} completed`);
});

console.log("Sync worker started.");
