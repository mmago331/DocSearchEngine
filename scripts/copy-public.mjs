import fs from "node:fs/promises";
import path from "node:path";

const srcDir = path.join(process.cwd(), "public");
const destDir = path.join(process.cwd(), "dist", "public");

async function copyDir(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  await fs.mkdir(dest, { recursive: true });
  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else if (entry.isSymbolicLink()) {
        const link = await fs.readlink(srcPath);
        await fs.symlink(link, destPath);
      } else if (entry.isFile()) {
        await fs.copyFile(srcPath, destPath);
      }
    })
  );
}

try {
  await fs.rm(destDir, { recursive: true, force: true });
  await fs.mkdir(destDir, { recursive: true });
  await copyDir(srcDir, destDir);
} catch (error) {
  console.error("Failed to copy public assets:", error);
  process.exitCode = 1;
}
