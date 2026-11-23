import type { AndroidBridge, AppInfo, AppStatus, NetworkStatus } from "./types";

const android: AndroidBridge | undefined = window.Android;

/** Installed apps. Empty when not running on the TV. */
export function getApps(): AppInfo[] {
    if (!android) return [];
    return JSON.parse(android.getApps()) as AppInfo[];
}

/** Package names of recently used apps, most recent first. Empty when not running on the TV or not granted yet. */
export function getRecentApps(): string[] {
    if (!android) return [];
    return JSON.parse(android.getRecentApps()) as string[];
}

/** The active connection. Offline when not running on the TV. */
export function getNetwork(): NetworkStatus {
    if (!android) return { state: "offline", signal: 0 };
    return JSON.parse(android.getNetwork()) as NetworkStatus;
}

export function launch(packageName: string): void {
    android?.launch(packageName);
}

export function openSettings(): void {
    android?.openSettings();
}

export function openDeveloperOptions(): void {
    android?.openDeveloperOptions();
}

export function reload(): void {
    android?.reload();
}

export function checkForUpdates(): void {
    android?.checkForUpdates();
}

/** Build info. Undefined when not running on the TV. */
export function getStatus(): AppStatus | undefined {
    if (!android) return undefined;
    return JSON.parse(android.getStatus()) as AppStatus;
}

/** Whether TTOS takes over Home (the Home button + covering Google's home screen). False when not running on the TV. */
export function getTakeOverHome(): boolean {
    return android?.getTakeOverHome() ?? false;
}

export function setTakeOverHome(on: boolean): void {
    android?.setTakeOverHome(on);
}

/** Installs the APK at `url` (from the dev server's APK drop folder); Android asks "Install this app?" first. Does nothing off the TV. */
export function installApk(url: string): void {
    android?.installApk(url);
}