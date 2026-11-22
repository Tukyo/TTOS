package com.tukyo.ttos

import android.app.Activity
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageInstaller
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI

/** Checks the update server for a newer TTOS build and installs it, silently when Android allows it. */
class TTOSUpdater(private val activity: Activity, private val serverUrl: String, private val onInstalling: () -> Unit) {
    companion object {
        const val ACTION_INSTALL_STATUS: String = "${BuildConfig.APPLICATION_ID}.INSTALL_STATUS"

        /** Called from MainActivity.onNewIntent: shows Android's "Install update?" prompt when the system asks for it. */
        fun handleInstallStatus(activity: Activity, intent: Intent) {
            if (intent.action != ACTION_INSTALL_STATUS) return
            val status: Int = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
            if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)?.let { activity.startActivity(it) }
            }
        }
    }

    /** Run on a background thread. Does nothing if the server is off or there's no newer build. */
    fun checkAndInstall() {
        try {
            val updateUrl: String = serverUrl + BuildConfig.UPDATE_PATH
            val metadata = JSONObject(download("$updateUrl/output-metadata.json").decodeToString())
            val latest: JSONObject = metadata.getJSONArray("elements").getJSONObject(0)
            val installed: Long = activity.packageManager.getPackageInfo(activity.packageName, 0).longVersionCode
            if (latest.getLong("versionCode") <= installed) return

            onInstalling()
            install(download("$updateUrl/${latest.getString("outputFile")}"))
        } catch (e: Exception) {
            // Server off, no build yet, or bad data: no update this time.
        }
    }

    private fun download(url: String): ByteArray {
        val connection: HttpURLConnection = URI(url).toURL().openConnection() as HttpURLConnection
        connection.connectTimeout = TTOSConfig.UPDATE_CONNECT_TIMEOUT_MS
        connection.readTimeout = TTOSConfig.UPDATE_READ_TIMEOUT_MS
        return connection.inputStream.use { it.readBytes() }
    }

    private fun install(apk: ByteArray) {
        val installer: PackageInstaller = activity.packageManager.packageInstaller
        installer.mySessions.forEach { installer.abandonSession(it.sessionId) }
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
        params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED)
        val sessionId: Int = installer.createSession(params)
        installer.openSession(sessionId).use { session ->
            session.openWrite("ttos.apk", 0, apk.size.toLong()).use { it.write(apk) }
            val statusIntent: Intent = Intent(activity, MainActivity::class.java).setAction(ACTION_INSTALL_STATUS)
            val pending: PendingIntent = PendingIntent.getActivity(
                activity,
                0,
                statusIntent,
                PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            session.commit(pending.intentSender)
        }
    }
}