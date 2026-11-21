package com.tukyo.ttos

import android.content.res.AssetManager
import android.webkit.MimeTypeMap
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.IOException

/** Serves the UI bundled in the APK, and falls back to it when the dev server can't be reached. */
class TTOSWebViewClient(private val assets: AssetManager) : WebViewClient() {

    companion object {
        const val BUNDLED_HOST = "appassets.androidplatform.net"
        const val BUNDLED_URL = "https://$BUNDLED_HOST/index.html"
    }

    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
        if (request.url.host != BUNDLED_HOST) return null

        val path = request.url.path.orEmpty().trimStart('/').ifEmpty { "index.html" }
        val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(path.substringAfterLast('.'))
        return try {
            WebResourceResponse(mime, "utf-8", assets.open(path))
        } catch (e: IOException) {
            null
        }
    }

    override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
        if (request.isForMainFrame && request.url.host != BUNDLED_HOST) {
            view.loadUrl(BUNDLED_URL)
        }
    }
}