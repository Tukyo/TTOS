package com.tukyo.ttos

import android.app.Activity
import android.content.Intent
import android.provider.Settings
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

class AndroidBridge(private val activity: Activity) {

    @JavascriptInterface
    fun getApps(): String {
        val pm = activity.packageManager
        val query = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER)
        val settingsPackage = pm.resolveActivity(Intent(Settings.ACTION_SETTINGS), 0)?.activityInfo?.packageName

        val apps = JSONArray()
        pm.queryIntentActivities(query, 0)
            .filter { it.activityInfo.packageName != activity.packageName && it.activityInfo.packageName != settingsPackage }
            .sortedBy { it.loadLabel(pm).toString().lowercase() }
            .forEach {
                apps.put(
                    JSONObject()
                        .put("label", it.loadLabel(pm).toString())
                        .put("packageName", it.activityInfo.packageName)
                )
            }
        return apps.toString()
    }

    @JavascriptInterface
    fun launch(packageName: String) {
        val intent = activity.packageManager.getLeanbackLaunchIntentForPackage(packageName) ?: return
        activity.runOnUiThread { activity.startActivity(intent) }
    }

    @JavascriptInterface
    fun openSettings() {
        activity.runOnUiThread { activity.startActivity(Intent(Settings.ACTION_SETTINGS)) }
    }
}