package com.tukyo.ttos

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

class AndroidBridge(private val activity: Activity) {

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
        if (!BuildConfig.DEBUG) return
        Thread { TTOSUpdater(activity, BuildConfig.DEV_SERVER_URL).checkAndInstall() }.start()
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