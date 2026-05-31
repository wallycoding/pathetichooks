import { cpSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const serverDir = resolve(root, ".output/server");
const stubsSrc = resolve(root, "stubs");
const stubsDest = resolve(serverDir, "stubs");
const pkgPath = resolve(serverDir, "package.json");

if (!existsSync(serverDir)) {
  console.error(`[patch] .output/server not found — run nuxt build first`);
  process.exit(1);
}

// Nitro pre-populates node_modules with .nitro/<pkg>@<version> dirs and a lock
// file that symlinks dependencies to them. Those references bypass npm overrides
// so the stub never reaches pinia's nested resolution. Wipe both so the next
// `npm install` resolves cleanly against our overrides.
rmSync(resolve(serverDir, "node_modules"), { recursive: true, force: true });
rmSync(resolve(serverDir, "package-lock.json"), { force: true });

cpSync(stubsSrc, stubsDest, { recursive: true });

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const stubRef = "file:./stubs/vue-devtools-api";
pkg.overrides = { ...(pkg.overrides ?? {}), "@vue/devtools-api": stubRef };
pkg.dependencies = { ...(pkg.dependencies ?? {}), "@vue/devtools-api": stubRef };
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log("[patch] cleaned pre-populated node_modules and injected @vue/devtools-api stub override");
