import ethernetIcon from "../assets/icons/ethernet.svg?raw";
import noInternetIcon from "../assets/icons/no-internet.svg?raw";
import wifiIcon from "../assets/icons/wifi.svg?raw";
import { getNetwork } from "../bridge";

import type { NetworkState, NetworkStatus } from "../bridge/types";

export const network = document.createElement("div");
network.className = "network";
updateNetwork();

/**
 * Shows the current connection as an icon. Runs once at start, then whenever Kotlin calls window.ttosNetwork.
 * data-state carries the state for CSS (e.g. red when there's no internet).
 * For Wi-Fi, arcs above the signal strength get the "off" class (dimmed in CSS); at least one arc always stays lit.
 */
export function updateNetwork(): void {
    const status: NetworkStatus = getNetwork();
    network.dataset.state = status.state;
    network.innerHTML = iconFor(status.state);

    const bars: NodeListOf<SVGPathElement> = network.querySelectorAll<SVGPathElement>(".bar");
    const lit: number = Math.max(1, Math.ceil(status.signal * bars.length));
    bars.forEach((bar: SVGPathElement, index: number) => bar.classList.toggle("off", index >= lit));
}

/** Which icon shows for each connection state. Offline reuses the "no internet" icon: for the household both mean "the internet isn't working". */
function iconFor(state: NetworkState): string {
    switch (state) {
        case "ethernet":
            return ethernetIcon;
        case "wifi":
            return wifiIcon;
        case "noInternet":
        case "offline":
            return noInternetIcon;
    }
}