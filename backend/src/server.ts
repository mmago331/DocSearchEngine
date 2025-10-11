import http from "node:http";
import app from "@/app";
import { env } from "@/lib/env";

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`[backend] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// crash visibility
process.on("unhandledRejection", (r) => console.error("[unhandledRejection]", r));
process.on("uncaughtException", (e) => console.error("[uncaughtException]", e));
