import ttosConfig from "../../ttos.config.json";

import type { KeyAction } from "./nav/types";
import type { TimeUnits } from "./types";

/**
 * The web's view of ttos.config.json, the one file every TTOS value lives in (Kotlin reads it through TTOSConfig.kt).
 * No values here, only names, types and what each one means.
 */

/** How many app tiles fit in one row of the "All apps" grid; also the most apps "Recently used" shows. CSS reads it as `--columns`. */
export const GRID_COLUMNS: number = ttosConfig.home.gridColumns;

/** Time units in milliseconds. */
export const TIME_MS: TimeUnits = {
    second: ttosConfig.time.secondMs,
    minute: ttosConfig.time.minuteMs,
};

/** Which key the remote sends means which action. Back, Home, Star, YouTube and Netflix don't reach the page; Kotlin calls window hooks for those instead. */
export const KEY_ACTIONS: Record<string, KeyAction> = ttosConfig.remote.keyActions as Record<string, KeyAction>;

/** How long to hold OK on the Settings tile to open the dev menu: longer than a normal long press, so it's hard to hit by accident. */
export const EXTRA_LONG_PRESS_MS: number = ttosConfig.longPress.extraMs;
