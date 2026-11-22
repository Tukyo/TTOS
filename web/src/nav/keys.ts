import { KEY_ACTIONS } from "../config";

import type { Action, RemoteButton } from "./types";

/** Calls `handler` for every remote action. */
export function onAction(handler: (action: Action) => void): void {
    window.addEventListener("keydown", (event) => {
        const action = KEY_ACTIONS[event.key];
        if (!action) return;
        event.preventDefault();
        handler(action);
    });

    // These buttons go to Android, not the page. Kotlin calls these instead.
    window.ttosBack = () => handler("back");
    window.ttosHome = () => handler("home");
    window.ttosButton = (button: RemoteButton) => handler(button);
}