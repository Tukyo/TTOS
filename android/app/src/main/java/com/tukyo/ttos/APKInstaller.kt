package com.tukyo.ttos

import android.app.Activity
import android.app.PendingIntent
import android.content.Intent
import android.content.IntentSender
import android.content.pm.PackageInstaller
import android.widget.Toast
import java.net.HttpURLConnection
import java.net.URI

/**
 * Installs an APK from a URL on the dev server, and uninstalls apps. Used by TTOSUpdater (TTOS's own updates) and
 * TTOSSideloader / AndroidBridge (other apps). The download streams straight into an Android install session, so big APKs
 * never sit in memory. TTOS's own updates install silently; for any other app, Android asks first ("Install this app?",
 * "Do you want to uninstall this app?"), then handleInstallStatus shows the result.
 */
object APKInstaller {
    /** The action of the intent Android sends back to MainActivity with an install's or uninstall's status. */
    const val ACTION_INSTALL_STATUS: String = "${BuildConfig.APPLICATION_ID}.INSTALL_STATUS"

    /** Extra on the status intent: what the result message says on success ("App installed" / "App uninstalled"). */
    private const val EXTRA_DONE_MESSAGE: String = "${BuildConfig.APPLICATION_ID}.DONE_MESSAGE"

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
            session.commit(statusReceiver(activity, "App installed"))
        }
    }

    /** Asks Android to uninstall `packageName`; Android asks "Do you want to uninstall this app?" first. */
    fun uninstall(activity: Activity, packageName: String) {
        activity.packageManager.packageInstaller.uninstall(packageName, statusReceiver(activity, "App uninstalled"))
    }

    /**
     * Called from MainActivity.onNewIntent with each status: shows Android's confirmation when the system asks for it, then a
     * short message with the result (a TTOS self-update never gets that far, it restarts TTOS).
     */
    fun handleInstallStatus(activity: Activity, intent: Intent) {
        if (intent.action != ACTION_INSTALL_STATUS) return
        when (intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)) {
            PackageInstaller.STATUS_PENDING_USER_ACTION ->
                intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)?.let { activity.startActivity(it) }

            PackageInstaller.STATUS_SUCCESS ->
                Toast.makeText(activity, intent.getStringExtra(EXTRA_DONE_MESSAGE) ?: "Done", Toast.LENGTH_LONG).show()

            PackageInstaller.STATUS_FAILURE_ABORTED ->
                Toast.makeText(activity, "Cancelled", Toast.LENGTH_LONG).show()

            else -> {
                val reason: String = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE) ?: "unknown reason"
                Toast.makeText(activity, "Failed: $reason", Toast.LENGTH_LONG).show()
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

    /** Where Android sends an install's or uninstall's status: MainActivity (→ handleInstallStatus), with the success message. */
    private fun statusReceiver(activity: Activity, doneMessage: String): IntentSender {
        val statusIntent: Intent = Intent(activity, MainActivity::class.java)
            .setAction(ACTION_INSTALL_STATUS)
            .putExtra(EXTRA_DONE_MESSAGE, doneMessage)
        val pending: PendingIntent = PendingIntent.getActivity(
            activity,
            0,
            statusIntent,
            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return pending.intentSender
    }
}
