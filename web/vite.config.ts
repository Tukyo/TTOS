import { createReadStream, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const config = JSON.parse(readFileSync(resolve(import.meta.dirname, "../ttos.config.json"), "utf-8"));
const apkDir = resolve(import.meta.dirname, "../android/app/build/outputs/apk/debug");

/** Dev server only: serves the latest APK + its metadata at devServer.updatePath (ttos.config.json) so TTOS can update itself. */
function serveUpdates(): Plugin {
  return {
    name: "ttos-serve-updates",
    configureServer(server) {
      server.middlewares.use(config.devServer.updatePath, (req, res, next) => {
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
    port: config.devServer.port,
    strictPort: true,
  },
});