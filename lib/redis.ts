import { Redis } from "@upstash/redis";
import IORedis from "ioredis";

// Upstash Redis (for rate limiting + caching via HTTP)
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// IORedis connection (for BullMQ – requires TCP Redis)
let ioRedisInstance: IORedis | null = null;

export function getIORedis(): IORedis {
  if (!ioRedisInstance) {
    ioRedisInstance = new IORedis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return ioRedisInstance;
}
