import { readFileSync, cpSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";
import { config } from "dotenv";

// Load env files (.env, then .env.local, then .env.production if NODE_ENV=production)
const envDir = new URL(".", import.meta.url).pathname;
config({ path: join(envDir, ".env") });
if (process.env.NODE_ENV === "production") {
  config({ path: join(envDir, ".env.production"), override: true });
}
config({ path: join(envDir, ".env.local"), override: true });

// Resolve studio assets from mastra package
const require = createRequire(import.meta.url);
const mastraPath = require.resolve("mastra");
const studioDir = resolve(mastraPath, "../../dist/studio");

if (!existsSync(studioDir)) {
  console.error(`Studio assets not found at: ${studioDir}`);
  process.exit(1);
}

const outDir = resolve(envDir, "dist");

// Clean output
if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true });
}

// Copy studio assets
cpSync(studioDir, outDir, { recursive: true });

// Replace %%PLACEHOLDER%% values in index.html with env vars
const indexPath = join(outDir, "index.html");
const html = readFileSync(indexPath, "utf-8");
const replaced = html.replaceAll(/%%(\w+)%%/g, (_, key) => process.env[key] ?? "");
writeFileSync(indexPath, replaced);

// CF Pages SPA routing — all non-asset paths fall back to index.html
writeFileSync(join(outDir, "_redirects"), "/* /index.html 200\n");

console.log("Studio built to dist/");
console.log(
  `  Server: ${process.env.MASTRA_SERVER_PROTOCOL}://${process.env.MASTRA_SERVER_HOST}:${process.env.MASTRA_SERVER_PORT}`,
);
