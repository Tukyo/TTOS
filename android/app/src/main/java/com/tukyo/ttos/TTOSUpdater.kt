package com.tukyo.ttos

import android.app.Activity
import org.json.JSONObject

/** Checks the dev server for a newer TTOS build and has APKInstaller install it (silently, since it's TTOS itself). */
class TTOSUpdater(private val activity: Activity, private val serverUrl: String, private val onInstalling: () -> Unit) {
    /** Run on a background thread. Does nothing if the server is off or there's no newer build. */
    fun checkAndInstall() {
        try {
            val updateUrl: String = serverUrl + TTOSConfig.DevServer.UPDATE_PATH
            val metadataText: String =
                APKInstaller.open("$updateUrl/output-metadata.json").inputStream.use { it.readBytes() }.decodeToString()
            val latest: JSONObject = JSONObject(metadataText).getJSONArray("elements").getJSONObject(0)
            val installed: Long = activity.packageManager.getPackageInfo(activity.packageName, 0).longVersionCode
            if (latest.getLong("versionCode") <= installed) return

            onInstalling()
            APKInstaller.install(activity, "$updateUrl/${latest.getString("outputFile")}")
        } catch (e: Exception) {
            // Server off, no build yet, or bad data: no update this time.
        }
    }
}