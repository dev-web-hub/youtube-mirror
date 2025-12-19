// Redis write-behind (non-blocking)
export async function writeSurveyEvent(payload) {
  if (!process.env.REDIS_URL) return;
  try {
    const redis = await import("redis");
    const r = redis.createClient({ url: process.env.REDIS_URL });
    await r.connect();
    await r.xAdd("cb:survey", "*", payload);
    await r.quit();
  } catch (_) {
    /* silent */
  }
}
