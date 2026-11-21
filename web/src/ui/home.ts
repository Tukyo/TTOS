import { getApps, launch, openSettings } from "../bridge";
import { setRows } from "../nav/focus";
import { createTile } from "./tile";

/** Renders the home screen into `root`: a row of apps, then a row with Settings. */
export function renderHome(root: HTMLElement): void {
    const appTiles = getApps().map((app) =>
        createTile(app.label, app.bannerUrl, () => launch(app.packageName)),
    );
    const settingsTile = createTile("Settings", undefined, openSettings);

    root.replaceChildren(createRow(appTiles), createRow([settingsTile]));
    setRows([appTiles, [settingsTile]]);
}

function createRow(tiles: HTMLElement[]): HTMLElement {
    const row = document.createElement("div");
    row.className = "row";
    row.append(...tiles);
    return row;
}