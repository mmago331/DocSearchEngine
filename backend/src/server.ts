import app from "@/app";
import { env } from "@/lib/env";
import ensureAdmin from "@/startup/ensureAdmin";

(async () => {
  try {
    await ensureAdmin();
  } catch (e) {
    console.error("[startup] ensureAdmin failed:", e);
  }

  const port = Number(env.PORT) || 4000;
  app.listen(port, () => {
    console.log(`[backend] listening on http://localhost:${port} (${env.NODE_ENV})`);
  });
})();
