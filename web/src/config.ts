/** Every tweakable web-side value in one place. Kotlin values live in TTOSConfig.kt; values both sides need live in ttos.config.json. */

/** How many app tiles fit in one row of the "All apps" grid. CSS reads it as `--columns`. */
export const GRID_COLUMNS = 5;

/** The most apps the "Recently used" row shows. */
export const RECENT_COUNT = 10;