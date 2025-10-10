import fs from "fs";
import path from "path";

const src = path.resolve("frontend/dist");
const dst = path.resolve("backend/dist/public");

fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(dst, { recursive: true });

function copyDir(from, to) {
  for (const entry of fs.readdirSync(from)) {
    const s = path.join(from, entry);
    const d = path.join(to, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

copyDir(src, dst);
console.log(`[build] copied UI from ${src} -> ${dst}`);
