package com.tukyo.ttos

import android.app.Activity
import org.json.JSONObject

/** What an update check found. The name goes to the web UI as is (window.ttosUpdateResult) after a manual check. */
enum class UpdateCheck { INSTALLING, UP_TO_DATE, UNREACHABLE }

/** Checks the dev server for a newer TTOS build and has APKInstaller install it (silently, since it's TTOS itself). */
class TTOSUpdater(private val activity: Activity, private val serverUrl: String, private val onInstalling: () -> Unit) {
    /** Run on a background thread. Installs a newer build if there is one, and says what it found. */
    fun checkAndInstall(): UpdateCheck {
        try {
            val updateUrl: String = serverUrl + TTOSConfig.DevServer.UPDATE_PATH
            val metadataText: String =
                APKInstaller.open("$updateUrl/output-metadata.json").inputStream.use { it.readBytes() }.decodeToString()
            val latest: JSONObject = JSONObject(metadataText).getJSONArray("elements").getJSONObject(0)
            val installed: Long = activity.packageManager.getPackageInfo(activity.packageName, 0).longVersionCode
            if (latest.getLong("versionCode") <= installed) return UpdateCheck.UP_TO_DATE

            onInstalling()
            APKInstaller.install(activity, "$updateUrl/${latest.getString("outputFile")}")
            return UpdateCheck.INSTALLING
        } catch (e: Exception) {
            // Server off, no build yet, or bad data.
            return UpdateCheck.UNREACHABLE
        }
    }
}
