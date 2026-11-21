import type { Action } from "./types";

const keyMap: Record<string, Action> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    Enter: "select",
};

/** Calls `handler` for every remote action. */
export function onAction(handler: (action: Action) => void): void {
    window.addEventListener("keydown", (event) => {
        const action = keyMap[event.key];
        if (!action) return;
        event.preventDefault();
        handler(action);
    });

    // The remote's Back button goes to Android, not the page. Kotlin calls this instead.
    window.ttosBack = () => handler("back");
}