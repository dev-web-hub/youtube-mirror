// --- AUTO-GENERATED: hub route registration ---
// This file is intentionally tiny and explicit.
// It is imported by appRenderhost.js

export function registerHubRoute(app) {
  app.use("/hub", app.static("hub"));
}
