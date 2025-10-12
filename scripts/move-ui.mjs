import { cp, mkdir, rm } from "fs/promises";
import { resolve } from "path";

const src = resolve("frontend/dist");
const dst = resolve("backend/dist/public");

await rm(dst, { recursive: true, force: true });
await mkdir(dst, { recursive: true });
await cp(src, dst, { recursive: true });
console.log(`[move-ui] copied ${src} -> ${dst}`);
