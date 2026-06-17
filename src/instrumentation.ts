// Runs once when the server starts. Boots the in-process cron scheduler
// (Node.js runtime only — not the edge runtime).
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCron } = await import("./lib/cron-scheduler")
    startCron()
  }
}
