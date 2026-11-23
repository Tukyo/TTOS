import { EXTRA_LONG_PRESS_MS, GRID_COLUMNS } from "../config";

import settingsIcon from "../assets/icons/settings.svg?raw";
import { getApps, getRecentApps, launch, openSettings } from "../bridge";
import { setHold, setRows } from "../nav/focus";
import { showAmbient } from "./ambient";
import { clock } from "./clock";
import { openDevMenu } from "./devmenu";
import { network } from "./network";
import { createTile } from "./tile";
import { weather } from "./weather";

import type { AppInfo } from "../bridge/types";

/**
 * Marks the top bar "stuck" while it's pinned at the top edge, so CSS fades in the scrim behind it. Pinned, it sits 1px
 * above the screen (top: -1px in ui.css), so "not fully on screen" means stuck. The browser calls this only when that
 * changes, never per scroll frame. Created once; renderHome points it at each new top bar.
 */
const stuckWatcher = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
        const entry: IntersectionObserverEntry | undefined = entries[entries.length - 1];
        entry?.target.classList.toggle("stuck", entry.intersectionRatio < 1);
    },
    { threshold: 1 },
);

/**
 * Renders the home screen into `root`: a top bar (clock + date, weather, network status, Settings gear: hold OK on it for
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
    const info = document.createElement("div");
    info.className = "top-bar-info";
    info.append(clock, weather);
    const system = document.createElement("div");
    system.className = "top-bar-system";
    system.append(network, settingsTile);
    topBar.append(info, system);

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
    stuckWatcher.disconnect();
    stuckWatcher.observe(topBar);
    // How much of the screen's top the stuck header covers, so focus scrolling keeps tiles below it (root.css).
    document.documentElement.style.setProperty("--header-height", `${topBar.offsetHeight}px`);
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