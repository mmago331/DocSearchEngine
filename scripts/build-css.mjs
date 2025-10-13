import { execSync } from "node:child_process";

execSync("npx tailwindcss -i ./styles/input.css -o ./public/styles.css --minify", { stdio: "inherit" });
