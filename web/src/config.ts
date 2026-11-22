import type { Action } from "./nav/types";
import type { TimeUnits } from "./types";

/** Web-side constants, imported by whichever file needs them. Kotlin's live in TTOSConfig.kt; values both sides need live in ttos.config.json. */

/** How many app tiles fit in one row of the "All apps" grid; also the most apps "Recently used" shows. CSS reads it as `--columns`. */
export const GRID_COLUMNS = 5;

/** Time units in milliseconds. */
export const TIME_MS: TimeUnits = {
    second: 1000,
    minute: 60000,
};

/** Which key the remote sends means which action. Back, Home, Star, YouTube and Netflix don't reach the page; Kotlin calls window hooks for those instead. */
export const KEY_ACTIONS: Record<string, Action> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    Enter: "select",
};