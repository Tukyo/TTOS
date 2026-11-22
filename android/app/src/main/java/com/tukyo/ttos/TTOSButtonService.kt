package com.tukyo.ttos

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.provider.Settings
import android.view.KeyEvent
import android.view.accessibility.AccessibilityEvent

/**
 * Sees remote buttons before Android's own handling.
 * Star / YouTube / Netflix → TTOS's web UI. Short Home → normal Home. Long Home → Settings.
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
                if (heldMs >= TTOSConfig.LONG_PRESS_MS) {
                    startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                } else {
                    performGlobalAction(GLOBAL_ACTION_HOME)
                }
            }
            return true
        }

        val button: String = remoteButtons[event.keyCode] ?: return false
        if (event.action == KeyEvent.ACTION_UP) MainActivity.current?.onRemoteButton(button)
        return true
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {}

    override fun onInterrupt() {}
}