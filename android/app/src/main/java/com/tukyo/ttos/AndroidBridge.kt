package com.tukyo.ttos

import android.app.usage.UsageStatsManager
import android.content.Intent
import android.content.pm.PackageManager
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
                            "https://${TTOSWebViewClient.BUNDLED_HOST}/banner/${it.activityInfo.packageName}"
                        )
                )
            }
        return apps.toString()
    }

    /** Package names of apps used in the last 30 days, most recent first. Empty until GET_USAGE_STATS is granted. */
    @JavascriptInterface
    fun getRecentApps(): String {
        val usage: UsageStatsManager = activity.getSystemService(UsageStatsManager::class.java) ?: return "[]"
        val now: Long = System.currentTimeMillis()

        val recent = JSONArray()
        usage.queryAndAggregateUsageStats(now - TimeUnit.DAYS.toMillis(30), now).values
            .filter { it.lastTimeUsed > 0 }
            .sortedByDescending { it.lastTimeUsed }
            .forEach { recent.put(it.packageName) }
        return recent.toString()
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
            .put("devServerUrl", BuildConfig.DEV_SERVER_URL)
        return status.toString()
    }
}