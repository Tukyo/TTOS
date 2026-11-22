package com.tukyo.ttos

import android.app.usage.UsageStatsManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.provider.Settings
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class AndroidBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun getApps(): String {
        val pm: PackageManager = activity.packageManager
        val query: Intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER)
        val settingsPackage: String? =
            pm.resolveActivity(Intent(Settings.ACTION_SETTINGS), 0)?.activityInfo?.packageName

        val apps = JSONArray()
        pm.queryIntentActivities(query, 0)
            .filter { it.activityInfo.packageName != activity.packageName && it.activityInfo.packageName != settingsPackage }
            .sortedBy { it.loadLabel(pm).toString().lowercase() }
            .forEach {
                apps.put(
                    JSONObject()
                        .put("label", it.loadLabel(pm).toString())
                        .put("packageName", it.activityInfo.packageName)
                        .put(
                            "bannerUrl",
                            "https://${TTOSConfig.BundledUi.HOST}${TTOSConfig.BundledUi.BANNER_PATH}${it.activityInfo.packageName}"
                        )
                )
            }
        return apps.toString()
    }

    /** Package names of recently used apps (window: TTOSConfig.RecentApps.DAYS), most recent first. Empty until GET_USAGE_STATS is granted. */
    @JavascriptInterface
    fun getRecentApps(): String {
        val usage: UsageStatsManager = activity.getSystemService(UsageStatsManager::class.java) ?: return "[]"
        val now: Long = System.currentTimeMillis()

        val recent = JSONArray()
        usage.queryAndAggregateUsageStats(now - TimeUnit.DAYS.toMillis(TTOSConfig.RecentApps.DAYS), now).values
            .filter { it.lastTimeUsed > 0 }
            .sortedByDescending { it.lastTimeUsed }
            .forEach { recent.put(it.packageName) }
        return recent.toString()
    }

    /**
     * The active connection as JSON: {"state": "ethernet" | "wifi" | "noInternet" | "offline", "signal": 0–1}.
     * "noInternet" = connected, but the internet doesn't answer. "signal" = Wi-Fi strength by Android's own bar formula (1 for anything else).
     */
    @JavascriptInterface
    fun getNetwork(): String {
        val connectivity: ConnectivityManager? = activity.getSystemService(ConnectivityManager::class.java)
        val capabilities: NetworkCapabilities? = connectivity?.getNetworkCapabilities(connectivity.activeNetwork)
        val state: String = when {
            capabilities == null -> "offline"
            !capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) -> "noInternet"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
            else -> "ethernet"
        }

        val wifi: WifiManager? = activity.getSystemService(WifiManager::class.java)
        val signal: Double = if (state == "wifi" && capabilities != null && wifi != null) {
            wifi.calculateSignalLevel(capabilities.signalStrength).toDouble() / wifi.maxSignalLevel
        } else {
            1.0
        }
        return JSONObject().put("state", state).put("signal", signal).toString()
    }

    @JavascriptInterface
    fun launch(packageName: String) {
        val intent: Intent = activity.packageManager.getLeanbackLaunchIntentForPackage(packageName) ?: return
        activity.runOnUiThread { activity.startActivity(intent) }
    }

    @JavascriptInterface
    fun openSettings() {
        activity.runOnUiThread { activity.startActivity(Intent(Settings.ACTION_SETTINGS)) }
    }

    @JavascriptInterface
    fun openDeveloperOptions() {
        activity.runOnUiThread { activity.startActivity(Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS)) }
    }

    @JavascriptInterface
    fun reload() {
        activity.runOnUiThread { activity.recreate() }
    }

    @JavascriptInterface
    fun checkForUpdates() {
        activity.checkForUpdates()
    }

    @JavascriptInterface
    fun getStatus(): String {
        val status: JSONObject = JSONObject()
            .put("versionName", BuildConfig.VERSION_NAME)
            .put("versionCode", BuildConfig.VERSION_CODE)
            .put("debug", BuildConfig.DEBUG)
            .put("devServerUrl", TTOSConfig.DevServer.URL)
        return status.toString()
    }

    /** Whether TTOS takes over Home (dev menu setting, read by TTOSButtonService). */
    @JavascriptInterface
    fun getTakeOverHome(): Boolean = TTOSSettings.takeOverHome(activity)

    @JavascriptInterface
    fun setTakeOverHome(on: Boolean) {
        TTOSSettings.setTakeOverHome(activity, on)
    }
}