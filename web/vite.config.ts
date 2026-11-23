import { execFile } from "node:child_process";
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { defineConfig, searchForWorkspaceRoot, type Plugin } from "vite";

const configPath = resolve(import.meta.dirname, "../ttos.config.json");
const config = JSON.parse(readFileSync(configPath, "utf-8"));
const apkDir = resolve(import.meta.dirname, "../android/app/build/outputs/apk/debug");
const dropDir = resolve(import.meta.dirname, "..", config.dev.apks.folder);
const run = promisify(execFile);

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

/** aapt2 from the newest Android SDK build-tools (ANDROID_HOME): Google's own tool, used to read what app an APK is. */
function findAapt2(): string | undefined {
  const sdk = process.env.ANDROID_HOME;
  if (!sdk) return undefined;
  const buildTools = resolve(sdk, "build-tools");
  if (!existsSync(buildTools)) return undefined;
  const newest = readdirSync(buildTools)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .pop();
  if (!newest) return undefined;
  const exe = resolve(buildTools, newest, process.platform === "win32" ? "aapt2.exe" : "aapt2");
  return existsSync(exe) ? exe : undefined;
}

const aapt2 = findAapt2();

/** What each APK is, cached per file + modification time (aapt2 takes a moment per APK). */
const apkInfo = new Map<string, { packageName: string; label: string; versionName: string; versionCode: number }>();

/**
 * Reads an APK's package name, app name and version with `aapt2 dump badging` (its first line is
 * "package: name='…' versionCode='…' versionName='…'", and "application-label:'…'" is the app's name).
 * Unknown (empty package name, file name as label) if aapt2 is missing or can't read the file.
 */
async function readApk(file: string, name: string, modified: number) {
  const key = `${file}|${modified}`;
  const cached = apkInfo.get(key);
  if (cached) return cached;

  const unknown = { packageName: "", label: name, versionName: "", versionCode: 0 };
  if (!aapt2) return unknown;
  try {
    const { stdout } = await run(aapt2, ["dump", "badging", file], { maxBuffer: 16 * 1024 * 1024 });
    const pkg = /package: name='([^']+)' versionCode='(\d+)' versionName='([^']*)'/.exec(stdout);
    const label = /application-label:'([^']*)'/.exec(stdout);
    if (!pkg) return unknown;
    const info = {
      packageName: pkg[1] ?? "",
      label: label?.[1] || name,
      versionName: pkg[3] ?? "",
      versionCode: Number(pkg[2]),
    };
    apkInfo.set(key, info);
    return info;
  } catch {
    return unknown;
  }
}

/**
 * Dev server only: the APK drop folder (dev.apks in ttos.config.json), so TTOS can install apps dropped there (dev menu →
 * Install apps). Its path lists the folder's APKs as JSON ([{ name, size, modified, packageName, label, versionName,
 * versionCode }], newest first; empty if the folder doesn't exist), and path/name.apk serves one (with its size, for
 * Android's installer).
 */
function serveApks(): Plugin {
  return {
    name: "ttos-serve-apks",
    configureServer(server) {
      server.middlewares.use(config.dev.apks.path, (req, res, next) => {
        const name = decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/");
        if (name === "/") {
          const files = existsSync(dropDir)
            ? readdirSync(dropDir).filter((file) => file.toLowerCase().endsWith(".apk"))
            : [];
          Promise.all(
            files.map(async (file) => {
              const path = resolve(dropDir, file);
              const stats = statSync(path);
              return { name: file, size: stats.size, modified: stats.mtimeMs, ...(await readApk(path, file, stats.mtimeMs)) };
            }),
          )
            .then((apks) => {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(apks.sort((a, b) => b.modified - a.modified)));
            })
            .catch(next);
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
