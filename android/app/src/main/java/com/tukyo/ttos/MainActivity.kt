package com.tukyo.ttos

import android.app.Activity
import android.content.pm.ApplicationInfo
import android.os.Bundle
import android.webkit.WebView
import android.window.OnBackInvokedDispatcher

class MainActivity : Activity() {

    private lateinit var webView: WebView

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
        webView.loadUrl(if (debuggable) "http://localhost:5173" else TTOSWebViewClient.BUNDLED_URL)
    }
}