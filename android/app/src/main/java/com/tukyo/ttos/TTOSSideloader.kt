package com.tukyo.ttos

import android.app.Activity

/** Installs other apps from the dev server's APK drop folder (dev menu → Install apps), through APKInstaller. */
object TTOSSideloader {
    /** Downloads and installs the APK at `url` in the background; Android asks "Install this app?" first. A failed download does nothing. */
    fun sideload(activity: Activity, url: String) {
        Thread {
            try {
                APKInstaller.install(activity, url)
            } catch (e: Exception) {
                // Dev server gone or download broke: nothing installs.
            }
        }.start()
    }
}