/**
 * A spinning loader (CSS: .loader in ui.css), for anything that takes a moment: put it in a modal with openLoading()
 * (ui/modal.ts), or append it anywhere else. One small rotating element, so it costs almost nothing while it shows.
 */
export function createLoader(): HTMLDivElement {
    const loader: HTMLDivElement = document.createElement("div");
    loader.className = "loader";
    return loader;
}
