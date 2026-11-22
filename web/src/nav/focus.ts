import type { Action } from "./types";

/** A saved focus state, restored when the layer on top of it closes. */
interface FocusLayer {
    rows: HTMLElement[][];
    row: number;
    col: number;
    start: HTMLElement | undefined;
    onBack: (() => void) | undefined;
}

let rows: HTMLElement[][] = [];
let row: number = 0;
let col: number = 0;
let start: HTMLElement | undefined = undefined;
let onBack: (() => void) | undefined = undefined;
const below: FocusLayer[] = [];

/**
 * Set what can be focused: rows of elements, top to bottom.
 * Focus goes to `first` (Home returns there too), or to the first element if `first` is missing.
 */
export function setRows(next: HTMLElement[][], first?: HTMLElement): void {
    rows = next.filter((r: HTMLElement[]) => r.length > 0);
    start = first;
    focusStart();
}

/** Put a temporary layer (e.g. a modal) on top of the current one. Back runs `back`. Focus goes to its first element. */
export function pushLayer(next: HTMLElement[][], back: () => void): void {
    below.push({ rows, row, col, start, onBack });
    setRows(next);
    onBack = back;
}

/** Remove the top layer and return focus to exactly where it was before. */
export function popLayer(): void {
    const previous: FocusLayer | undefined = below.pop();
    if (!previous) return;
    rows = previous.rows;
    row = previous.row;
    col = previous.col;
    start = previous.start;
    onBack = previous.onBack;
    focusCurrent();
}

/**
 * Arrows move focus. Select clicks the focused element. Back runs the top layer's back action, if it has one.
 * Home closes every open layer (e.g. modals) and focuses the start element.
 * Star / YouTube / Netflix are caught by the accessibility service and do nothing yet.
 */
export function handle(action: Action): void {
    const current: HTMLElement[] | undefined = rows[row];
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
            onBack?.();
            return;
        case "home":
            for (let i: number = below.length; i > 0; i--) onBack?.();
            focusStart();
            return;
        case "star":
        case "youtube":
        case "netflix":
            // TODO: decide what Star / YouTube / Netflix do (see roadmap: "Decide what each button does").
            return;
    }
    focusCurrent();
}

/** Focus the layer's start element, or the first element if it has none (or it isn't in the rows). */
function focusStart(): void {
    const target: HTMLElement | undefined = start;
    const found: number = target ? rows.findIndex((r: HTMLElement[]) => r.includes(target)) : -1;
    row = Math.max(0, found);
    col = target ? Math.max(0, rows[row]?.indexOf(target) ?? 0) : 0;
    focusCurrent();
}

function focusCurrent(): void {
    const current: HTMLElement[] | undefined = rows[row];
    if (!current) return;
    col = Math.min(col, current.length - 1);
    current[col]?.focus();
}