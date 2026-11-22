package com.tukyo.ttos

/** Kotlin-side constants, used by whichever file needs them. Web-side constants live in web/src/config.ts; values both sides need live in ttos.config.json. */
object TTOSConfig {
    /** Minimum time between automatic update checks when TTOS comes on screen. */
    const val UPDATE_CHECK_COOLDOWN_MS: Long = 30000

    /** How long to wait for the dev server before falling back to the bundled UI (connect and read, each). */
    const val DEV_SERVER_TIMEOUT_MS: Int = 500

    /** How long to wait for the update server to answer. */
    const val UPDATE_CONNECT_TIMEOUT_MS: Int = 2000

    /** How long to wait while downloading an update (metadata or APK). */
    const val UPDATE_READ_TIMEOUT_MS: Int = 10000

    /** How long a remote button must be held to count as a long press (Home → Settings; Star later). */
    const val LONG_PRESS_MS: Long = 500

    /** How far back the "Recently used" row looks. */
    const val RECENT_APPS_DAYS: Long = 30

    /** Banner size used when an app's banner/icon doesn't report its own size (TV banner standard, 16:9). */
    const val BANNER_FALLBACK_WIDTH: Int = 320
    const val BANNER_FALLBACK_HEIGHT: Int = 180

    /** TTOS's own settings, saved on the TV (a SharedPreferences file: survives reboots and updates). */
    object Prefs {
        /** Name of the settings file. */
        const val FILE = "ttos"

        /** Whether TTOS takes over Home (the Home button + covering Google's home screen). Toggled in the dev menu. */
        object TakeOverHome {
            const val KEY = "takeOverHome"

            /** Off, so a fresh install changes nothing for the household. */
            const val DEFAULT = false
        }
    }
}