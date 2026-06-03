// lib/redisClient.js
// Lazy singleton Redis client using `redis` (node-redis v4).
// Exported as `getRedis()` — returns the connected client or null
// when Redis is unavailable (so the rest of the app degrades gracefully).

import { createClient } from "redis";

let client = null;
let connecting = false;

/**
 * Returns a connected redis client, or null if Redis is unreachable.
 * The client is created and connected only once (singleton pattern).
 */
export const getRedis = async () => {
  // Already connected
  if (client?.isReady) return client;

  // Prevent concurrent connection races
  if (connecting) {
    // Wait a short moment then return whatever we have
    await new Promise((r) => setTimeout(r, 200));
    return client?.isReady ? client : null;
  }

  const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";

  connecting = true;
  try {
    client = createClient({
      url,
      socket: {
        connectTimeout: 3000,   // 3s connect timeout
        reconnectStrategy: (retries) => {
          if (retries > 3) return false; // stop retrying after 3 attempts
          return Math.min(retries * 200, 1000);
        },
      },
    });

    client.on("error", (err) => {
      // Log only, don't crash — routes handle null gracefully
      console.warn("⚠️  Redis error:", err.message);
    });

    client.on("ready", () => {
      console.log("✅ Redis connected:", url);
    });

    await client.connect();
    return client;
  } catch (err) {
    console.warn("⚠️  Redis unavailable — caching/rate-limiting disabled:", err.message);
    client = null;
    return null;
  } finally {
    connecting = false;
  }
};

export default getRedis;
