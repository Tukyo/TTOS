import { checkForUpdates, getStatus, getTakeOverHome, openDeveloperOptions, openSettings, reload, setTakeOverHome } from "../bridge";
import { openModal } from "./modal";

import type { AppStatus } from "../bridge/types";
import type { ModalLine } from "./types";

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

/** The Status screen: what's installed and where the UI comes from, as label + value lines. */
function openStatus(): void {
    const status: AppStatus | undefined = getStatus();
    const lines: ModalLine[] = status === undefined
        ? ["Not running on the TV (no Android bridge)."]
        : [
            { label: "Version", value: status.versionName },
            { label: "Build", value: `${status.versionCode} · ${status.debug ? "debug" : "release"}` },
            { label: "UI source", value: location.origin === status.devServerUrl ? "Live dev server" : "Bundled copy" },
            { label: "Dev server", value: status.devServerUrl },
        ];
    openModal("Status", [{ label: "Back to menu", onSelect: openDevMenu }], lines);
}

/** Flips the Home takeover, then reopens the menu so the option shows the new state. */
function toggleTakeOverHome(): void {
    setTakeOverHome(!getTakeOverHome());
    openDevMenu();
}