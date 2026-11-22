package com.tukyo.ttos

import android.app.Activity
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageInstaller
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI

/** Checks the update server for a newer TTOS build and asks Android to install it. */
class TTOSUpdater(private val activity: Activity, private val serverUrl: String) {

    companion object {
        const val ACTION_INSTALL_STATUS = "com.tukyo.ttos.INSTALL_STATUS"

        /** Called from MainActivity.onNewIntent: shows Android's "Install update?" prompt when the system asks for it. */
        fun handleInstallStatus(activity: Activity, intent: Intent) {
            if (intent.action != ACTION_INSTALL_STATUS) return
            val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
            if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)?.let { activity.startActivity(it) }
            }
        }
    }

    /** Run on a background thread. Does nothing if the server is off or there's no newer build. */
    fun checkAndInstall() {
        try {
            val metadata = JSONObject(download("$serverUrl/update/output-metadata.json").decodeToString())
            val latest = metadata.getJSONArray("elements").getJSONObject(0)
            val installed = activity.packageManager.getPackageInfo(activity.packageName, 0).longVersionCode
            if (latest.getLong("versionCode") <= installed) return

            install(download("$serverUrl/update/${latest.getString("outputFile")}"))
        } catch (e: Exception) {
            // Server off, no build yet, or bad data: no update this time.
        }
    }

    private fun download(url: String): ByteArray {
        val connection = URI(url).toURL().openConnection() as HttpURLConnection
        connection.connectTimeout = 2000
        connection.readTimeout = 10000
        return connection.inputStream.use { it.readBytes() }
    }

    private fun install(apk: ByteArray) {
        val installer = activity.packageManager.packageInstaller
        val sessionId = installer.createSession(PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL))
        installer.openSession(sessionId).use { session ->
            session.openWrite("ttos.apk", 0, apk.size.toLong()).use { it.write(apk) }
            val statusIntent = Intent(activity, MainActivity::class.java).setAction(ACTION_INSTALL_STATUS)
            val pending = PendingIntent.getActivity(activity, 0, statusIntent, PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            session.commit(pending.intentSender)
        }
    }
}