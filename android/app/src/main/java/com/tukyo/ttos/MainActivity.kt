package com.tukyo.ttos

import android.app.Activity
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
        setContentView(webView)
        webView.requestFocus()

        onBackInvokedDispatcher.registerOnBackInvokedCallback(
            OnBackInvokedDispatcher.PRIORITY_DEFAULT
        ) {
            webView.evaluateJavascript("window.ttosBack?.()", null)
        }

        webView.loadUrl("http://localhost:5173")
    }
}