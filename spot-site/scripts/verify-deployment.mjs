import { access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const requiredFiles = [
  "dist/index.html",
  "dist/favicon.svg",
  "dist/account-actions.js",
  "dist/event-categories.js",
  "dist/event-create.js",
  "dist/event-home.js",
  "dist/event-map.js",
  "dist/event-moderation.js",
  "dist/event-reactions.js",
  "dist/events-data.js",
  "dist/assets/cover-aperitivo.jpg",
  "dist/assets/cover-concert.jpg",
  "dist/assets/cover-gallery.jpg",
  "dist/assets/spot-logo.png",
];

for (const file of requiredFiles) {
  await access(resolve(projectRoot, file));
}

execFileSync(process.execPath, ["test-functional.mjs"], {
  cwd: projectRoot,
  stdio: "inherit",
});
execFileSync(process.execPath, ["test-comments.cjs"], {
  cwd: projectRoot,
  stdio: "inherit",
});

console.log("Vercel static deployment output is ready.");
