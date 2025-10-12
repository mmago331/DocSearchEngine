import { execSync } from "node:child_process";
import { rmSync, mkdirSync, cpSync } from "node:fs";
import { resolve } from "node:path";

const run = (cmd, cwd) => execSync(cmd, { stdio: "inherit", cwd });

const root = resolve("..");
const src = resolve(root, "frontend/dist");
const dst = resolve("dist/public");

run("npm ci --workspace frontend", root);
run("npm run build --workspace frontend", root);

rmSync(dst, { recursive: true, force: true });
mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true });

console.log(`[build-ui] copied ${src} -> ${dst}`);
