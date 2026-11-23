import { APKS_PATH } from "../config";
import {
    checkForUpdates,
    getInstalledVersion,
    getStatus,
    getTakeOverHome,
    installApk,
    launch,
    openDeveloperOptions,
    openSettings,
    reload,
    setTakeOverHome,
    uninstall,
} from "../bridge";
import { openLoading, openModal } from "./modal";

import type { AppStatus } from "../bridge/types";
import type { ApkFile, ModalLine, ModalOption, UpdateResult } from "./types";

/** Closes the "Checking for updates" modal of a manual check in progress, if any. */
let closeCheck: (() => void) | undefined = undefined;

/** The hidden dev menu, opened by the Konami code (↑↑↓↓←→←→). */
export function openDevMenu(): void {
    openModal("TTOS Dev Menu", [
        { label: "Open Settings", onSelect: openSettings },
        { label: "Developer options", onSelect: openDeveloperOptions },
        { label: `Take over Home: ${getTakeOverHome() ? "On" : "Off"}`, onSelect: toggleTakeOverHome },
        { label: "Reload UI", onSelect: reload },
        { label: "Check for updates now", onSelect: checkUpdatesNow },
        { label: "Install apps", onSelect: () => void openInstallApps() },
        { label: "Status", onSelect: openStatus },
    ]);
}

/**
 * Dev menu → Check for updates now: a loading modal while the TV asks the dev server. A newer build replaces it with
 * "Installing update" (window.ttosUpdating); otherwise onUpdateResult says what the check found.
 */
function checkUpdatesNow(): void {
    closeCheck = openLoading("Checking for updates");
    checkForUpdates();
}

/** Called by the Kotlin wrapper (window.ttosUpdateResult) when a manual check installs nothing: closes the loading modal and says why. */
export function onUpdateResult(result: UpdateResult): void {
    closeCheck?.();
    closeCheck = undefined;
    const back: ModalOption[] = [{ label: "OK", onSelect: openDevMenu }];
    if (result === "UP_TO_DATE") openModal("Up to date", back, ["TTOS is already running the newest build."]);
    else openModal("Couldn't check for updates", back, ["The dev server didn't answer. Is npm run dev running on the PC?"]);
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

/** Closes the "Downloading …" modal of the install in progress, if any. */
let closeDownload: (() => void) | undefined = undefined;

/** Called by the Kotlin wrapper (window.ttosInstallStatus) when an install moves on: closes the "Downloading …" modal. */
export function onInstallStatus(): void {
    closeDownload?.();
    closeDownload = undefined;
}

/**
 * The "Install apps" screen: the APKs in the dev server's drop folder (apks/ in the repo, served at APKS_PATH), in two
 * sections: "Ready to install" (not on the TV) and "Installed" (marked when the folder has a newer version). Choosing one
 * opens its actions; Android itself confirms every install and uninstall. Only works while TTOS shows the live dev
 * server's UI (the bundled copy can't reach the dev server).
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

    const ready: ModalOption[] = [];
    const installed: ModalOption[] = [];
    apks.forEach((apk: ApkFile) => {
        const version: number | undefined = apk.packageName ? getInstalledVersion(apk.packageName) : undefined;
        if (version === undefined) {
            ready.push({ section: "Ready to install", label: describe(apk), onSelect: () => openReadyApp(apk) });
        } else {
            const label: string = version < apk.versionCode ? `${apk.label} · update available` : apk.label;
            installed.push({ section: "Installed", label, onSelect: () => openInstalledApp(apk, version) });
        }
    });
    openModal("Install apps", [...ready, ...installed, back]);
}

/** An APK's name with its version, e.g. "SmartTube 31.02". */
function describe(apk: ApkFile): string {
    return apk.versionName ? `${apk.label} ${apk.versionName}` : apk.label;
}

/** Actions for an app that isn't on the TV yet. */
function openReadyApp(apk: ApkFile): void {
    openModal(describe(apk), [
        { label: "Install", onSelect: () => download(apk) },
        { label: "Cancel", onSelect: () => void openInstallApps() },
    ]);
}

/** Actions for an app that's already on the TV (`installedVersion` = its versionCode); Update only if the folder's APK is newer. */
function openInstalledApp(apk: ApkFile, installedVersion: number): void {
    const options: ModalOption[] = [{ label: "Open", onSelect: () => launch(apk.packageName) }];
    if (installedVersion < apk.versionCode) options.push({ label: `Update to ${apk.versionName}`, onSelect: () => download(apk) });
    options.push(
        { label: "Uninstall", onSelect: () => uninstall(apk.packageName) },
        { label: "Cancel", onSelect: () => void openInstallApps() },
    );
    openModal(apk.label, options);
}

/** Downloads and installs `apk` (install or update), with a loading modal until Android's confirmation comes up. */
function download(apk: ApkFile): void {
    installApk(`${location.origin}${APKS_PATH}/${encodeURIComponent(apk.name)}`);
    closeDownload = openLoading(`Downloading ${apk.label}`);
}