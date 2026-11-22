package com.tukyo.ttos

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.provider.Settings
import android.view.KeyEvent
import android.view.accessibility.AccessibilityEvent

/**
 * Sees remote buttons before Android's own handling, and which screen comes to the front.
 * Star / YouTube / Netflix → TTOS's web UI. Long Home → Settings.
 * Short Home → TTOS while TTOS takes over Home (dev menu setting), else normal Home.
 * While TTOS takes over Home, Android's own home screen is covered by TTOS whenever it shows.
 * Every other button passes through untouched.
 */
class TTOSButtonService : AccessibilityService() {

    private val remoteButtons: Map<Int, String> = mapOf(
        KeyEvent.KEYCODE_MACRO_1 to "star",
        KeyEvent.KEYCODE_BUTTON_3 to "youtube",
        KeyEvent.KEYCODE_BUTTON_4 to "netflix",
    )

    override fun onKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_HOME) {
            if (event.action == KeyEvent.ACTION_UP) {
                val heldMs: Long = event.eventTime - event.downTime
                when {
                    heldMs >= TTOSConfig.LONG_PRESS_MS ->
                        startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))

                    TTOSSettings.takeOverHome(this) -> showTTOS()
                    else -> performGlobalAction(GLOBAL_ACTION_HOME)
                }
            }
            return true
        }

        val button: String = remoteButtons[event.keyCode] ?: return false
        if (event.action == KeyEvent.ACTION_UP) MainActivity.current?.onRemoteButton(button)
        return true
    }

    /** Android (re)connects this service after every TTOS update and at boot. While TTOS takes over Home, TTOS comes up right away. */
    override fun onServiceConnected() {
        super.onServiceConnected()
        if (TTOSSettings.takeOverHome(this)) showTTOS()
    }

    /** While TTOS takes over Home: whenever Android's own home screen (its current Home pick, e.g. Google's) comes to the front, TTOS covers it. */
    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        if (!TTOSSettings.takeOverHome(this)) return
        val home: ActivityInfo =
            packageManager.resolveActivity(homeIntent(), PackageManager.MATCH_DEFAULT_ONLY)?.activityInfo ?: return
        if (home.packageName == packageName) return
        if (event.packageName?.toString() == home.packageName && event.className?.toString() == home.name) showTTOS()
    }

    /** Brings TTOS to the front as the home screen (one shared way to do it: MainActivity.startAsHome). */
    private fun showTTOS() {
        MainActivity.startAsHome(this)
    }

    /** The intent Android sends when Home is pressed. */
    private fun homeIntent(): Intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)

    override fun onInterrupt() {}
}