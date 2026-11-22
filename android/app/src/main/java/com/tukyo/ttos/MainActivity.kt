package com.tukyo.ttos

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.provider.Settings
import android.view.KeyEvent
import android.webkit.WebView
import android.window.OnBackInvokedDispatcher
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI

class MainActivity : Activity() {
    companion object {
        /** The running TTOS screen, so TTOSButtonService can reach the web UI. Null when TTOS isn't running. */
        var current: MainActivity? = null
            private set
    }

    private lateinit var webView: WebView
    private val konamiCode: List<Int> = listOf(
        KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_DPAD_UP,
        KeyEvent.KEYCODE_DPAD_DOWN, KeyEvent.KEYCODE_DPAD_DOWN,
        KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.KEYCODE_DPAD_RIGHT,
        KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.KEYCODE_DPAD_RIGHT,
    )

    private var konamiProgress: Int = 0
    private var lastUpdateCheck: Long = 0

    private val appsChangedReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            webView.evaluateJavascript("window.ttosRefresh?.()", null)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        val defaultHandler: Thread.UncaughtExceptionHandler? = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread: Thread, error: Throwable ->
            startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            defaultHandler?.uncaughtException(thread, error)
        }

        super.onCreate(savedInstanceState)

        webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.addJavascriptInterface(AndroidBridge(this), "Android")
        webView.webViewClient = TTOSWebViewClient(assets, packageManager)
        setContentView(webView)
        webView.requestFocus()
        current = this

        onBackInvokedDispatcher.registerOnBackInvokedCallback(
            OnBackInvokedDispatcher.PRIORITY_DEFAULT
        ) {
            webView.evaluateJavascript("window.ttosBack?.()", null)
        }

        val packageChanges = IntentFilter().apply {
            addAction(Intent.ACTION_PACKAGE_ADDED)
            addAction(Intent.ACTION_PACKAGE_REMOVED)
            addAction(Intent.ACTION_PACKAGE_CHANGED)
            addDataScheme("package")
        }
        registerReceiver(appsChangedReceiver, packageChanges, RECEIVER_NOT_EXPORTED)

        if (!BuildConfig.DEBUG) {
            webView.loadUrl(TTOSWebViewClient.BUNDLED_URL)
            return
        }

        val devUrl: String = BuildConfig.DEV_SERVER_URL
        Thread {
            val devServerUp: Boolean = try {
                val connection: HttpURLConnection = URI(devUrl).toURL().openConnection() as HttpURLConnection
                connection.connectTimeout = TTOSConfig.DEV_SERVER_TIMEOUT_MS
                connection.readTimeout = TTOSConfig.DEV_SERVER_TIMEOUT_MS
                connection.responseCode == 200
            } catch (e: IOException) {
                false
            }
            runOnUiThread { webView.loadUrl(if (devServerUp) devUrl else TTOSWebViewClient.BUNDLED_URL) }
        }.start()
    }

    override fun onResume() {
        super.onResume()
        webView.evaluateJavascript("window.ttosRefresh?.()", null)
        val now: Long = System.currentTimeMillis()
        if (now - lastUpdateCheck < TTOSConfig.UPDATE_CHECK_COOLDOWN_MS) return
        lastUpdateCheck = now
        checkForUpdates()
    }

    /** Checks the dev server for a newer TTOS build in the background. Shows the web "Installing update" modal if one installs. */
    fun checkForUpdates() {
        if (!BuildConfig.DEBUG) return
        Thread {
            TTOSUpdater(this, BuildConfig.DEV_SERVER_URL) {
                runOnUiThread { webView.evaluateJavascript("window.ttosUpdating?.()", null) }
            }.checkAndInstall()
        }.start()
    }

    /** Called by TTOSButtonService for Star / YouTube / Netflix. Passes the button to the web UI. */
    fun onRemoteButton(button: String) {
        webView.evaluateJavascript("window.ttosButton?.('$button')", null)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (intent.hasCategory(Intent.CATEGORY_HOME)) webView.evaluateJavascript("window.ttosHome?.()", null)
        TTOSUpdater.handleInstallStatus(this, intent)
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
            konamiProgress = when {
                event.keyCode == konamiCode[konamiProgress] -> konamiProgress + 1
                event.keyCode == KeyEvent.KEYCODE_DPAD_UP -> if (konamiProgress == 2) 2 else 1
                else -> 0
            }
            if (konamiProgress == konamiCode.size) {
                konamiProgress = 0
                openDevMenuOrSettings()
            }
        }
        return super.dispatchKeyEvent(event)
    }

    /** Opens the web dev menu. If the web UI doesn't answer (broken or blank), opens Settings natively. */
    private fun openDevMenuOrSettings() {
        val script = "typeof window.ttosDevMenu === 'function' ? (window.ttosDevMenu(), 'ok') : 'none'"
        webView.evaluateJavascript(script) { result: String? ->
            if (result != "\"ok\"") startActivity(Intent(Settings.ACTION_SETTINGS))
        }
    }

    override fun onDestroy() {
        if (current === this) current = null
        unregisterReceiver(appsChangedReceiver)
        super.onDestroy()
    }
}