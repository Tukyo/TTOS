import { APKS_PATH } from "../config";
import { checkForUpdates, getStatus, getTakeOverHome, installApk, openDeveloperOptions, openSettings, reload, setTakeOverHome } from "../bridge";
import { openModal } from "./modal";

import type { AppStatus } from "../bridge/types";
import type { ApkFile, ModalLine, ModalOption } from "./types";

/** The hidden dev menu, opened by the Konami code (↑↑↓↓←→←→). */
export function openDevMenu(): void {
    openModal("TTOS Dev Menu", [
        { label: "Open Settings", onSelect: openSettings },
        { label: "Developer options", onSelect: openDeveloperOptions },
        { label: `Take over Home: ${getTakeOverHome() ? "On" : "Off"}`, onSelect: toggleTakeOverHome },
        { label: "Reload UI", onSelect: reload },
        { label: "Check for updates now", onSelect: checkForUpdates },
        { label: "Install apps", onSelect: () => void openInstallApps() },
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

/**
 * The "Install apps" screen: lists the APKs in the dev server's drop folder (apks/ in the repo, served at APKS_PATH),
 * newest first; OK on one installs it. Only works while TTOS shows the live dev server's UI (the bundled copy can't reach
 * the dev server).
 */
async function openInstallApps(): Promise<void> {
    const back: ModalOption = { label: "Back to menu", onSelect: openDevMenu };
    if (location.origin !== getStatus()?.devServerUrl) {
        openModal("Install apps", [back], ["Needs the dev server: run npm run dev on the PC, then Reload UI."]);
        return;
    }

    let apks: ApkFile[];
    try {
        const response: Response = await fetch(`${APKS_PATH}/`);
        apks = await response.json();
    } catch {
        apks = [];
    }
    if (apks.length === 0) {
        openModal("Install apps", [back], ["No APKs in the drop folder. Drop one into apks/ in the repo."]);
        return;
    }

    const options: ModalOption[] = apks.map((apk: ApkFile) => ({ label: apk.name, onSelect: () => installFromDrop(apk) }));
    openModal("Install apps", [...options, back]);
}

/** Starts installing `apk` from the drop folder and tells the viewer what happens next. */
function installFromDrop(apk: ApkFile): void {
    installApk(`${location.origin}${APKS_PATH}/${encodeURIComponent(apk.name)}`);
    openModal(`Installing ${apk.name}`, [{ label: "OK", onSelect: () => { } }], ["Downloading… Android will ask \"Install this app?\" in a moment."]);
}