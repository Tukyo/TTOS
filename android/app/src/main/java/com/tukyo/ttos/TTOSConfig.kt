package com.tukyo.ttos

import android.view.KeyEvent
import org.json.JSONObject

/**
 * Kotlin's view of ttos.config.json, the one file every TTOS value lives in (Gradle embeds it as BuildConfig.CONFIG_JSON).
 * No values here, only names, types and what each one means. The web reads the same file through web/src/config.ts.
 */
object TTOSConfig {
    private val json = JSONObject(BuildConfig.CONFIG_JSON)

    /** Everything about the dev PC: its dev server and the DevTools access. */
    private val dev: JSONObject = json.getJSONObject("dev")

    object DevServer {
        private val section: JSONObject = dev.getJSONObject("server")

        /** The dev PC's IP. The debug build loads the dev server from it, and only it may connect to TTOS's DevTools port. */
        val HOST: String = section.getString("host")

        /** Where the debug build looks for the PC's dev server, e.g. "http://192.168.0.18:5173". */
        val URL: String = "http://$HOST:${section.getInt("port")}"

        /** Path on the dev server that serves the latest APK and its metadata for self-update. */
        val UPDATE_PATH: String = section.getString("updatePath")

        /** How long to wait for the dev server before falling back to the bundled UI (connect and read, each). */
        val TIMEOUT_MS: Int = section.getInt("timeoutMs")
    }

    object DevTools {
        /** Network port TTOS opens for chrome://inspect (instead of ADB). Only DevServer.HOST may connect. */
        val PORT: Int = dev.getJSONObject("tools").getInt("port")
    }

    /** The viewport: any device on the home network can send a link to the TV (TTOSViewport). */
    object Viewport {
        private val section: JSONObject = json.getJSONObject("viewport")

        /** Network port of the "Send to TV" page, e.g. http://192.168.0.14:8099. */
        val PORT: Int = section.getInt("port")

        /** The page's file in the APK's bundled assets (from web/public/). */
        val PAGE: String = section.getString("page")

        /** Package name of the browser sent links open in (TV Bro). */
        val BROWSER: String = section.getString("browser")
    }

    object Update {
        private val section: JSONObject = json.getJSONObject("update")

        /** Minimum time between automatic update checks when TTOS comes on screen. */
        val CHECK_COOLDOWN_MS: Long = section.getLong("checkCooldownMs")

        /** How long to wait for the update server to answer. */
        val CONNECT_TIMEOUT_MS: Int = section.getInt("connectTimeoutMs")

        /** How long to wait while downloading an update (metadata or APK). */
        val READ_TIMEOUT_MS: Int = section.getInt("readTimeoutMs")
    }

    object BundledUi {
        private val section: JSONObject = json.getJSONObject("bundledUi")

        /** Made-up host the WebView loads the APK's built-in UI and app banners from. TTOSWebViewClient answers it; it never reaches the network. */
        val HOST: String = section.getString("host")

        /** The built-in UI's start page. */
        val URL: String = "https://$HOST/index.html"

        /** Path prefix for app banners, followed by the package name, e.g. https://HOST/banner/com.netflix.ninja. */
        val BANNER_PATH: String = section.getString("bannerPath")
    }

    object Banner {
        private val section: JSONObject = json.getJSONObject("banner")

        /** Size used when an app's banner/icon doesn't report its own (TV banner standard, 16:9). */
        val FALLBACK_WIDTH: Int = section.getInt("fallbackWidth")
        val FALLBACK_HEIGHT: Int = section.getInt("fallbackHeight")
    }

    object RecentApps {
        /** How far back the "Recently used" row looks. */
        val DAYS: Long = json.getJSONObject("recentApps").getLong("days")
    }

    object LongPress {
        /** How long a remote button must be held to count as a long press (Home → Settings; Star later). */
        val MS: Long = json.getJSONObject("longPress").getLong("normalMs")
    }

    object Remote {
        private val section: JSONObject = json.getJSONObject("remote")

        /** The dev menu's secret code. The JSON names keys without Android's "KEYCODE_" prefix (DPAD_UP = KeyEvent.KEYCODE_DPAD_UP). */
        val KONAMI_CODE: List<Int> = section.getJSONArray("konamiCode").let { names ->
            List(names.length()) { index -> keyCode(names.getString(index)) }
        }

        /** Remote buttons TTOSButtonService catches and passes to the web UI, key code → button name. */
        val BUTTONS: Map<Int, String> = section.getJSONObject("buttons").let { buttons ->
            buttons.keys().asSequence().associate { name -> keyCode(name) to buttons.getString(name) }
        }

        private fun keyCode(name: String): Int = KeyEvent.keyCodeFromString("KEYCODE_$name")
    }

    /** TTOS's own settings, saved on the TV (a SharedPreferences file: survives reboots and updates). */
    object Prefs {
        private val section: JSONObject = json.getJSONObject("prefs")

        /** Name of the settings file. */
        val FILE: String = section.getString("file")

        /** Whether TTOS takes over Home (the Home button + covering Google's home screen). Toggled in the dev menu. */
        object TakeOverHome {
            private val setting: JSONObject = section.getJSONObject("takeOverHome")

            val KEY: String = setting.getString("key")

            /** Off, so a fresh install changes nothing for the household. */
            val DEFAULT: Boolean = setting.getBoolean("default")
        }
    }
}