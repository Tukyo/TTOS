import type { AndroidBridge, AppInfo, AppStatus, NetworkState } from "./types";

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

/** The active connection. "none" when not running on the TV. */
export function getNetwork(): NetworkState {
    if (!android) return "none";
    return android.getNetwork() as NetworkState;
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