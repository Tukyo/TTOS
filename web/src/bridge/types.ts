declare global {
    interface Window {
        /** Present only inside the TTOS app's WebView on the TV. */
        Android?: AndroidBridge;
    }
}

/** One launchable app installed on the Streamer. */
export interface AppInfo {
    /** Display name, e.g. "Netflix". */
    label: string;
    /** Android package name, e.g. "com.netflix.ninja". Used to launch it. */
    packageName: string;
    /** URL of the app's TV banner (320×180) or icon, served by the Kotlin side. Absent if the app has none. */
    bannerUrl?: string;
}

/** Build info shown on the dev menu's Status screen. */
export interface AppStatus {
    /** Human version from web/package.json, e.g. "0.0.1". */
    versionName: string;
    /** Android's build number (seconds since 2026-01-01 at build time). */
    versionCode: number;
    /** True for debug builds (dev server + self-update), false for release. */
    debug: boolean;
    /** Where the dev server is expected, from ttos.config.json. */
    devServerUrl: string;
}

/** The active connection's state. "noInternet" = connected, but the internet doesn't answer; "offline" = no connection at all. */
export type NetworkState = "ethernet" | "wifi" | "noInternet" | "offline";

/** What `getNetwork()` reports. */
export interface NetworkStatus {
    state: NetworkState;
    /** Wi-Fi strength from 0 to 1, by Android's own bar formula. Always 1 for anything that isn't Wi-Fi. */
    signal: number;
}

/**
 * What the Kotlin wrapper injects as `window.Android`.
 * Android's JS bridge can only pass strings, numbers and booleans,
 * so lists arrive as JSON strings.
 */
export interface AndroidBridge {
    /** JSON-encoded AppInfo[]. */
    getApps(): string;
    /** JSON-encoded string[]: package names, most recently used first. Empty until GET_USAGE_STATS is granted. */
    getRecentApps(): string;
    /** JSON-encoded NetworkStatus. */
    getNetwork(): string;
    launch(packageName: string): void;
    openSettings(): void;
    openDeveloperOptions(): void;
    /** Restarts TTOS's screen, which re-checks dev server vs bundled copy. */
    reload(): void;
    /** Checks the update server now, skipping the automatic-check cooldown (TTOSConfig.Update.CHECK_COOLDOWN_MS). */
    checkForUpdates(): void;
    /** JSON-encoded AppStatus. */
    getStatus(): string;
    /** Whether TTOS takes over Home (the Home button + covering Google's home screen). Saved on the TV, off by default. */
    getTakeOverHome(): boolean;
    setTakeOverHome(on: boolean): void;
    /** Downloads and installs the APK at `url` (an app in the dev server's APK drop folder); Android asks "Install this app?" first. */
    installApk(url: string): void;
    /** Uninstalls an app; Android asks "Do you want to uninstall this app?" first. */
    uninstall(packageName: string): void;
    /** The installed version (versionCode) of an app, or -1 if it isn't installed. */
    getInstalledVersion(packageName: string): number;
}