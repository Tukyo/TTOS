import { getNetwork } from "../bridge";
import type { NetworkState } from "../bridge/types";

/** The top-bar network status. Created once, so every re-render of home reuses the same element. */
export const network = document.createElement("div");
network.className = "network";
updateNetwork();

/** Shows the current connection. Runs once at start, then whenever Kotlin calls window.ttosNetwork. */
export function updateNetwork(): void {
    network.textContent = label(getNetwork());
}

/** What the top bar shows for each connection state. */
function label(state: NetworkState): string {
    switch (state) {
        case "ethernet":
            return "Ethernet";
        case "wifi":
            return "Wi-Fi";
        case "none":
            return "No internet";
    }
}