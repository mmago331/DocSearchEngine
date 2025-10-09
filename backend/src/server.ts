import app from "@/app";
import { env } from "@/lib/env";

const port = Number(env.PORT) || 4000;

app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port} (${env.NODE_ENV})`);
});
