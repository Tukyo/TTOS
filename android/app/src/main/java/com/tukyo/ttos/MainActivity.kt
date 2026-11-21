package com.tukyo.ttos

import android.app.Activity
import android.content.Intent
import android.content.pm.ApplicationInfo
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
    private val konamiCode = listOf(
        KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_DPAD_UP,
        KeyEvent.KEYCODE_DPAD_DOWN, KeyEvent.KEYCODE_DPAD_DOWN,
        KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.KEYCODE_DPAD_RIGHT,
        KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.KEYCODE_DPAD_RIGHT,
    )
    private var konamiProgress = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.addJavascriptInterface(AndroidBridge(this), "Android")
        webView.webViewClient = TTOSWebViewClient(assets)
        setContentView(webView)
        webView.requestFocus()

        onBackInvokedDispatcher.registerOnBackInvokedCallback(
            OnBackInvokedDispatcher.PRIORITY_DEFAULT
        ) {
            webView.evaluateJavascript("window.ttosBack?.()", null)
        }

        val debuggable = (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
        if (!debuggable) {
            webView.loadUrl(TTOSWebViewClient.BUNDLED_URL)
            return
        }

        val devUrl = "http://localhost:5173"
        Thread {
            val devServerUp = try {
                val connection = URI(devUrl).toURL().openConnection() as HttpURLConnection
                connection.connectTimeout = 500
                connection.readTimeout = 500
                connection.responseCode == 200
            } catch (e: IOException) {
                false
            }
            runOnUiThread { webView.loadUrl(if (devServerUp) devUrl else TTOSWebViewClient.BUNDLED_URL) }
        }.start()
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