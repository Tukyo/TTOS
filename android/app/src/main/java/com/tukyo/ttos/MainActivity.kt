package com.tukyo.ttos

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.KeyEvent
import android.webkit.WebView
import android.window.OnBackInvokedDispatcher
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI

class MainActivity : Activity() {

    private lateinit var webView: WebView
    private val konamiCode: List<Int> = listOf(
        KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_DPAD_UP,
        KeyEvent.KEYCODE_DPAD_DOWN, KeyEvent.KEYCODE_DPAD_DOWN,
        KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.KEYCODE_DPAD_RIGHT,
        KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.KEYCODE_DPAD_RIGHT,
    )

    private var konamiProgress: Int = 0
    private var lastUpdateCheck: Long = 0

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

        onBackInvokedDispatcher.registerOnBackInvokedCallback(
            OnBackInvokedDispatcher.PRIORITY_DEFAULT
        ) {
            webView.evaluateJavascript("window.ttosBack?.()", null)
        }

        if (!BuildConfig.DEBUG) {
            webView.loadUrl(TTOSWebViewClient.BUNDLED_URL)
            return
        }

        val devUrl: String = BuildConfig.DEV_SERVER_URL
        Thread {
            val devServerUp: Boolean = try {
                val connection: HttpURLConnection = URI(devUrl).toURL().openConnection() as HttpURLConnection
                connection.connectTimeout = 500
                connection.readTimeout = 500
                connection.responseCode == 200
            } catch (e: IOException) {
                false
            }
            runOnUiThread { webView.loadUrl(if (devServerUp) devUrl else TTOSWebViewClient.BUNDLED_URL) }
        }.start()
    }

    override fun onResume() {
        super.onResume()
        if (!BuildConfig.DEBUG) return
        val now: Long = System.currentTimeMillis()
        if (now - lastUpdateCheck < 30_000) return
        lastUpdateCheck = now
        Thread { TTOSUpdater(this, BuildConfig.DEV_SERVER_URL).checkAndInstall() }.start()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
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
                startActivity(Intent(Settings.ACTION_SETTINGS))
            }
        }
        return super.dispatchKeyEvent(event)
    }
}