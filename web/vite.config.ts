import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, searchForWorkspaceRoot, type Plugin } from "vite";

const configPath = resolve(import.meta.dirname, "../ttos.config.json");
const config = JSON.parse(readFileSync(configPath, "utf-8"));
const apkDir = resolve(import.meta.dirname, "../android/app/build/outputs/apk/debug");
const dropDir = resolve(import.meta.dirname, "..", config.dev.apks.folder);

/** Dev server only: serves the latest APK + its metadata at dev.server.updatePath (ttos.config.json) so TTOS can update itself. */
function serveUpdates(): Plugin {
  return {
    name: "ttos-serve-updates",
    configureServer(server) {
      server.middlewares.use(config.dev.server.updatePath, (req, res, next) => {
        const file = resolve(apkDir, "." + (req.url ?? "/").split("?")[0]);
        if (!file.startsWith(apkDir) || !existsSync(file)) return next();
        createReadStream(file).pipe(res);
      });
    },
  };
}

/**
 * Dev server only: the APK drop folder (dev.apks in ttos.config.json), so TTOS can install apps dropped there (dev menu →
 * Install apps). Its path lists the folder's APKs as JSON ([{ name, size, modified }], newest first; empty if the folder
 * doesn't exist), and path/name.apk serves one (with its size, for Android's installer).
 */
function serveApks(): Plugin {
  return {
    name: "ttos-serve-apks",
    configureServer(server) {
      server.middlewares.use(config.dev.apks.path, (req, res, next) => {
        const name = decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/");
        if (name === "/") {
          const apks = existsSync(dropDir)
            ? readdirSync(dropDir)
              .filter((file) => file.toLowerCase().endsWith(".apk"))
              .map((file) => {
                const stats = statSync(resolve(dropDir, file));
                return { name: file, size: stats.size, modified: stats.mtimeMs };
              })
              .sort((a, b) => b.modified - a.modified)
            : [];
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(apks));
          return;
        }

        const file = resolve(dropDir, "." + name);
        if (!file.startsWith(dropDir) || !existsSync(file)) return next();
        res.setHeader("Content-Length", String(statSync(file).size));
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [serveUpdates(), serveApks()],
  server: {
    host: true,
    port: config.dev.server.port,
    strictPort: true,
    fs: {
      allow: [searchForWorkspaceRoot(import.meta.dirname), configPath],
    },
  },
});