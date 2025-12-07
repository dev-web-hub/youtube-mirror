export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // ---- PHASE 8 INGEST (already live) ----
    if (url.pathname === "/log" && req.method === "POST") {
      const data = await req.json();
      const ts = Date.now();
      const key = `log:${ts}:${Math.random().toString(36).slice(2)}`;

      await env.CUBECAST_LOGS.put(key, JSON.stringify({
        ...data,
        ts
      }));

      return new Response("OK");
    }

    // ---- ✅ PHASE 9 READ ENDPOINT ----
    if (url.pathname === "/analytics") {
      const list = await env.CUBECAST_LOGS.list({ limit: 500 });

      const rows = [];
      for (const k of list.keys) {
        const v = await env.CUBECAST_LOGS.get(k.name);
        if (v) rows.push(JSON.parse(v));
      }

      return new Response(JSON.stringify(rows), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
