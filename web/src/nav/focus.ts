import type { Action } from "./types";

let rows: HTMLElement[][] = [];
let row = 0;
let col = 0;

/** Set what can be focused: rows of elements, top to bottom. Focus goes to the first one. */
export function setRows(next: HTMLElement[][]): void {
    rows = next.filter((r) => r.length > 0);
    row = 0;
    col = 0;
    focusCurrent();
}

/** Arrows move focus. Select clicks the focused element. */
export function handle(action: Action): void {
    const current = rows[row];
    if (!current) return;

    switch (action) {
        case "up":
            row = Math.max(0, row - 1);
            break;
        case "down":
            row = Math.min(rows.length - 1, row + 1);
            break;
        case "left":
            col = Math.max(0, col - 1);
            break;
        case "right":
            col = Math.min(current.length - 1, col + 1);
            break;
        case "select":
            current[col]?.click();
            return;
        case "back":
            return;
    }
    focusCurrent();
}

function focusCurrent(): void {
    const current = rows[row];
    if (!current) return;
    col = Math.min(col, current.length - 1);
    current[col]?.focus();
}