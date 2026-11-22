import { createReadStream, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, searchForWorkspaceRoot, type Plugin } from "vite";

const configPath = resolve(import.meta.dirname, "../ttos.config.json");
const config = JSON.parse(readFileSync(configPath, "utf-8"));
const apkDir = resolve(import.meta.dirname, "../android/app/build/outputs/apk/debug");

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

export default defineConfig({
  base: "./",
  plugins: [serveUpdates()],
  server: {
    host: true,
    port: config.dev.server.port,
    strictPort: true,
    fs: {
      allow: [searchForWorkspaceRoot(import.meta.dirname), configPath],
    },
  },
});