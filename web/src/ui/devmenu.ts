import { checkForUpdates, getStatus, getTakeOverHome, openDeveloperOptions, openSettings, reload, setTakeOverHome } from "../bridge";
import { openModal } from "./modal";

import type { AppStatus } from "../bridge/types";

/** The hidden dev menu, opened by the Konami code (↑↑↓↓←→←→). */
export function openDevMenu(): void {
    openModal("TTOS Dev Menu", [
        { label: "Open Settings", onSelect: openSettings },
        { label: "Developer options", onSelect: openDeveloperOptions },
        { label: `Take over Home: ${getTakeOverHome() ? "On" : "Off"}`, onSelect: toggleTakeOverHome },
        { label: "Reload UI", onSelect: reload },
        { label: "Check for updates now", onSelect: checkForUpdates },
        { label: "Status", onSelect: openStatus },
    ]);
}

function openStatus(): void {
    const status: AppStatus | undefined = getStatus();
    const lines: string[] = status === undefined
        ? ["Not running on the TV (no Android bridge)."]
        : [
            `Version: ${status.versionName} (build ${status.versionCode})`,
            `Build: ${status.debug ? "debug" : "release"}`,
            `UI source: ${location.origin === status.devServerUrl ? "live dev server" : "bundled copy"}`,
            `Dev server: ${status.devServerUrl}`,
        ];
    openModal("Status", [{ label: "Back to menu", onSelect: openDevMenu }], lines);
}

/** Flips the Home takeover, then reopens the menu so the option shows the new state. */
function toggleTakeOverHome(): void {
    setTakeOverHome(!getTakeOverHome());
    openDevMenu();
}