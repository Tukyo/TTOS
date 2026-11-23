package com.tukyo.ttos

import android.app.Activity
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageInstaller
import android.widget.Toast
import java.net.HttpURLConnection
import java.net.URI

/**
 * Installs an APK from a URL on the dev server. Used by TTOSUpdater (TTOS's own updates) and TTOSSideloader (other apps).
 * The download streams straight into an Android install session, so big APKs never sit in memory. TTOS's own updates
 * install silently; any other app makes Android ask "Install this app?" first (handleInstallStatus).
 */
object APKInstaller {
    /** The action of the intent Android sends back to MainActivity with an install's status. */
    const val ACTION_INSTALL_STATUS: String = "${BuildConfig.APPLICATION_ID}.INSTALL_STATUS"

    /** Downloads the APK at `url` and installs it. Run on a background thread; throws if the download fails. */
    fun install(activity: Activity, url: String) {
        val installer: PackageInstaller = activity.packageManager.packageInstaller
        installer.mySessions.forEach { installer.abandonSession(it.sessionId) }
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
        params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED)
        val sessionId: Int = installer.createSession(params)
        installer.openSession(sessionId).use { session ->
            val connection: HttpURLConnection = open(url)
            session.openWrite("app.apk", 0, connection.contentLengthLong).use { output ->
                connection.inputStream.use { input -> input.copyTo(output) }
            }
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

    /**
     * Called from MainActivity.onNewIntent with each install's status: shows Android's "Install this app?" prompt when the
     * system asks for it, then a short message with the result (a TTOS self-update never gets that far, it restarts TTOS).
     */
    fun handleInstallStatus(activity: Activity, intent: Intent) {
        if (intent.action != ACTION_INSTALL_STATUS) return
        when (intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)) {
            PackageInstaller.STATUS_PENDING_USER_ACTION ->
                intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)?.let { activity.startActivity(it) }

            PackageInstaller.STATUS_SUCCESS ->
                Toast.makeText(activity, "App installed", Toast.LENGTH_LONG).show()

            else -> {
                val reason: String = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE) ?: "unknown reason"
                Toast.makeText(activity, "Install failed: $reason", Toast.LENGTH_LONG).show()
            }
        }
    }

    /** An HTTP connection to the dev server with the update timeouts. */
    fun open(url: String): HttpURLConnection {
        val connection: HttpURLConnection = URI(url).toURL().openConnection() as HttpURLConnection
        connection.connectTimeout = TTOSConfig.Update.CONNECT_TIMEOUT_MS
        connection.readTimeout = TTOSConfig.Update.READ_TIMEOUT_MS
        return connection
    }
}