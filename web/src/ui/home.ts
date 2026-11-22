import { EXTRA_LONG_PRESS_MS, GRID_COLUMNS } from "../config";

import settingsIcon from "../assets/icons/settings.svg?raw";
import { getApps, getRecentApps, launch, openSettings } from "../bridge";
import { setHold, setRows } from "../nav/focus";
import { showAmbient } from "./ambient";
import { clock } from "./clock";
import { openDevMenu } from "./devmenu";
import { network } from "./network";
import { createTile } from "./tile";

import type { AppInfo } from "../bridge/types";

/**
 * Renders the home screen into `root`: a top bar (clock, network status, Settings gear: hold OK on it for
 * EXTRA_LONG_PRESS_MS to open the dev menu, for anyone who forgets the Konami code; the gear winds up while held and
 * spins before either opens), the "Recently used" row (at
 * most one grid row, so it never scrolls sideways; hidden when empty), then the "All apps" grid. Focus starts on the
 * most recent app, else the first app. Focusing Recently used scrolls the page to the very top, so the top bar shows too.
 */
export function renderHome(root: HTMLElement): void {
    const apps = getApps();
    const recentApps = getRecentApps()
        .flatMap((packageName) => apps.filter((app) => app.packageName === packageName))
        .slice(0, GRID_COLUMNS);

    const settingsTile = createTile("Settings", undefined, () => spinThen(settingsTile, openSettings));
    settingsTile.innerHTML = settingsIcon;
    settingsTile.addEventListener("focus", () => showAmbient(undefined));
    setHold(settingsTile, EXTRA_LONG_PRESS_MS, () => spinThen(settingsTile, openDevMenu));
    const recentTiles = recentApps.map(createAppTile);
    const appTiles = apps.map(createAppTile);

    const topBar = document.createElement("div");
    topBar.className = "top-bar";
    topBar.append(clock, network, settingsTile);

    const grid = document.createElement("div");
    grid.className = "grid";
    grid.style.setProperty("--columns", String(GRID_COLUMNS));
    grid.append(...appTiles);

    const sections: HTMLElement[] = [topBar];
    if (recentTiles.length > 0) {
        const recentSection = createSection("Recently used", createRow(recentTiles));
        recentSection.addEventListener("focusin", () => root.scrollIntoView());
        sections.push(recentSection);
    }
    sections.push(createSection("All apps", grid));

    root.replaceChildren(...sections);
    setRows([[settingsTile], recentTiles, ...chunk(appTiles, GRID_COLUMNS)], recentTiles[0] ?? appTiles[0]);
}

/** Plays the tile's "spinning" animation (CSS), then runs `action` once it has finished. */
function spinThen(tile: HTMLElement, action: () => void): void {
    tile.classList.add("spinning");
    const spin: Animation | undefined = tile.querySelector("svg")?.getAnimations()[0];
    void (spin ? spin.finished : Promise.resolve()).then(() => {
        tile.classList.remove("spinning");
        action();
    });
}

/** A titled block: a heading above `content`. */
function createSection(title: string, content: HTMLElement): HTMLElement {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.className = "section-title";
    heading.textContent = title;
    section.append(heading, content);
    return section;
}

/** A tile that launches `app`. Focusing it tints the background glow with the app's color. */
function createAppTile(app: AppInfo): HTMLButtonElement {
    const tile: HTMLButtonElement = createTile(app.label, app.bannerUrl, () => launch(app.packageName));
    tile.addEventListener("focus", () => showAmbient(app.bannerUrl));
    return tile;
}

/** A horizontal row of tiles. */
function createRow(tiles: HTMLElement[]): HTMLElement {
    const row = document.createElement("div");
    row.className = "row";
    row.append(...tiles);
    return row;
}

/** Splits `items` into rows of `size` (the last row may be shorter). */
function chunk<T>(items: T[], size: number): T[][] {
    const rows: T[][] = [];
    for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
    return rows;
}