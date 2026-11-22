import { GRID_COLUMNS, RECENT_COUNT } from "../config";

import { getApps, getRecentApps, launch, openSettings } from "../bridge";
import type { AppInfo } from "../bridge/types";
import { setRows } from "../nav/focus";
import { createTile } from "./tile";

/**
 * Renders the home screen into `root`: a top bar (Settings), the "Recently used" row (hidden when empty),
 * then the "All apps" grid. Focus starts on the most recent app, else the first app.
 */
export function renderHome(root: HTMLElement): void {
    const apps = getApps();
    const recentApps = getRecentApps()
        .flatMap((packageName) => apps.filter((app) => app.packageName === packageName))
        .slice(0, RECENT_COUNT);

    const settingsTile = createTile("Settings", undefined, openSettings);
    const recentTiles = recentApps.map(createAppTile);
    const appTiles = apps.map(createAppTile);

    const topBar = document.createElement("div");
    topBar.className = "top-bar";
    topBar.append(settingsTile);

    const grid = document.createElement("div");
    grid.className = "grid";
    grid.style.setProperty("--columns", String(GRID_COLUMNS));
    grid.append(...appTiles);

    const sections: HTMLElement[] = [topBar];
    if (recentTiles.length > 0) sections.push(createSection("Recently used", createRow(recentTiles)));
    sections.push(createSection("All apps", grid));

    root.replaceChildren(...sections);
    setRows([[settingsTile], recentTiles, ...chunk(appTiles, GRID_COLUMNS)], recentTiles[0] ?? appTiles[0]);
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

/** A tile that launches `app`. */
function createAppTile(app: AppInfo): HTMLButtonElement {
    return createTile(app.label, app.bannerUrl, () => launch(app.packageName));
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