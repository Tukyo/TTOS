/** A focusable tile: banner image if there is one, plus the label. Select or click runs `onSelect`. */
export function createTile(
    label: string,
    bannerUrl: string | undefined,
    onSelect: () => void,
): HTMLButtonElement {
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.addEventListener("click", onSelect);

    if (bannerUrl) {
        const banner = document.createElement("img");
        banner.src = bannerUrl;
        banner.alt = "";
        tile.append(banner);
    }

    const name = document.createElement("span");
    name.className = "tile-label";
    name.textContent = label;
    tile.append(name);

    return tile;
}