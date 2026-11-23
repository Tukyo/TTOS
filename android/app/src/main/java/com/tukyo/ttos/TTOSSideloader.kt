package com.tukyo.ttos

import android.widget.Toast

/** Installs other apps from the dev server's APK drop folder (dev menu → Install apps), through APKInstaller. */
object TTOSSideloader {
    /**
     * Downloads and installs the APK at `url` in the background; Android asks "Install this app?" first. If the download
     * fails, a message says so and the web UI is told (so its loading modal closes), since no install status will come.
     */
    fun sideload(activity: MainActivity, url: String) {
        Thread {
            try {
                APKInstaller.install(activity, url)
            } catch (e: Exception) {
                activity.runOnUiThread {
                    Toast.makeText(activity, "Download failed", Toast.LENGTH_LONG).show()
                    activity.notifyInstallStatus()
                }
            }
        }.start()
    }
}
