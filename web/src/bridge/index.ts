import type { AppInfo } from "./types";

const android = window.Android;

/** Installed apps. Empty when not running on the TV. */
export function getApps(): AppInfo[] {
    if (!android) return [];
    return JSON.parse(android.getApps()) as AppInfo[];
}

export function launch(packageName: string): void {
    android?.launch(packageName);
}

export function openSettings(): void {
    android?.openSettings();
}