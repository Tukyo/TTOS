/** One launchable app installed on the Streamer. */
export interface AppInfo {
    /** Display name, e.g. "Netflix". */
    label: string;
    /** Android package name, e.g. "com.netflix.ninja". Used to launch it. */
    packageName: string;
    /** URL of the app's TV banner (320×180) or icon, served by the Kotlin side. Absent if the app has none. */
    bannerUrl?: string;
}

/**
 * What the Kotlin wrapper injects as `window.Android`.
 * Android's JS bridge can only pass strings, numbers and booleans,
 * so lists arrive as JSON strings.
 */
export interface AndroidBridge {
    /** JSON-encoded AppInfo[]. */
    getApps(): string;
    launch(packageName: string): void;
    openSettings(): void;
}

declare global {
    interface Window {
        /** Present only inside the TTOS app's WebView on the TV. */
        Android?: AndroidBridge;
    }
}