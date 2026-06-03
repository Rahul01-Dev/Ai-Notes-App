import { Redis } from '@upstash/redis';

let client = null;

export const getRedis = async () => {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("⚠️  Upstash Redis credentials missing (UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN) — caching/rate-limiting disabled.");
    return null;
  }

  try {
    // Upstash client initialization using environment variables
    client = Redis.fromEnv();
    return client;
  } catch (err) {
    console.error("⚠️  Failed to initialize Upstash Redis:", err.message);
    return null;
  }
};
