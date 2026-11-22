import { KEY_ACTIONS } from "../config";

import type { Action, KeyAction, RemoteButton } from "./types";

/**
 * Calls `handler` for every remote action. Arrows repeat while held (auto-repeat moves focus along).
 * OK is reported as selectDown (press) and selectUp (release), so the focus engine can tell a hold from a click.
 * The TV's auto-repeat presses aren't always marked as repeats, so focus.ts also ignores presses until the release.
 */
export function onAction(handler: (action: Action) => void): void {
    window.addEventListener("keydown", (event: KeyboardEvent) => {
        const key: KeyAction | undefined = KEY_ACTIONS[event.key];
        if (!key) return;
        event.preventDefault();
        if (key !== "select") handler(key);
        else if (!event.repeat) handler("selectDown");
    });

    window.addEventListener("keyup", (event: KeyboardEvent) => {
        if (KEY_ACTIONS[event.key] !== "select") return;
        event.preventDefault();
        handler("selectUp");
    });

    // These buttons go to Android, not the page. Kotlin calls these instead.
    window.ttosBack = () => handler("back");
    window.ttosHome = () => handler("home");
    window.ttosButton = (button: RemoteButton) => handler(button);
}