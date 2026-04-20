import { Queue } from "bullmq";
import { getIORedis } from "@/lib/redis";

export type SyncJobData = {
  userId: string;
  type: "FULL" | "INCREMENTAL" | "MANUAL" | "WEBHOOK";
  stravaActivityId?: string; // for WEBHOOK type
  afterTimestamp?: number;   // for INCREMENTAL type
};

export const syncQueue = new Queue<SyncJobData>("strava-sync", {
  connection: getIORedis(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

export async function enqueueSyncJob(data: SyncJobData) {
  const jobId = data.type === "WEBHOOK" && data.stravaActivityId
    ? `webhook-${data.stravaActivityId}`
    : `${data.type.toLowerCase()}-${data.userId}-${Date.now()}`;

  return syncQueue.add(data.type, data, { jobId, deduplication: { id: jobId } });
}
