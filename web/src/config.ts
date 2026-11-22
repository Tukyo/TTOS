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

/**
 * The ambient background: the top-left glow takes the focused app's dominant color (ui/ambient.ts). All 0–1 unless noted.
 * - sampleWidth / sampleHeight: size (px) the banner is shrunk to for sampling.
 * - minLightness / maxLightness / minSaturation: pixels darker, brighter or greyer than this count as colorless and are ignored.
 * - hueBuckets: how many slices the color wheel is cut into; the slice with the most (saturation-weighted) votes wins.
 * - minColorfulShare: at least this share of pixels must be colorful, else the app keeps the default glow.
 * - glowLightness / glowAlpha: every app's glow gets this brightness and strength, so dark and bright logos glow equally.
 */
export const AMBIENT: Readonly<typeof ttosConfig.ambient> = ttosConfig.ambient;
