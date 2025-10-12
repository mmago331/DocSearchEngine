// scripts/move-ui.mjs
import { cp, mkdir } from "node:fs/promises";

await mkdir("backend/dist/public", { recursive: true });
await cp("frontend/dist", "backend/dist/public", { recursive: true });
console.log("[build] moved frontend/dist -> backend/dist/public");
