package com.tukyo.ttos

import android.content.res.AssetManager
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.webkit.MimeTypeMap
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.IOException
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream

/** Serves the UI bundled in the APK, and falls back to it when the dev server can't be reached. */
class TTOSWebViewClient(private val assets: AssetManager, private val packageManager: PackageManager) :
    WebViewClient() {
    companion object {
        const val BUNDLED_HOST = "appassets.androidplatform.net"
        const val BUNDLED_URL = "https://$BUNDLED_HOST/index.html"
    }

    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
        if (request.url.host != BUNDLED_HOST) return null
        request.url.path?.removePrefix("/banner/")?.takeIf { it != request.url.path }?.let { return bannerResponse(it) }

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

    private fun bannerResponse(packageName: String): WebResourceResponse? {
        val drawable = try {
            packageManager.getLeanbackLaunchIntentForPackage(packageName)?.let { packageManager.getActivityBanner(it) }
                ?: packageManager.getApplicationBanner(packageName)
                ?: packageManager.getApplicationIcon(packageName)
        } catch (e: PackageManager.NameNotFoundException) {
            return null
        }

        val width = drawable.intrinsicWidth.takeIf { it > 0 } ?: 320
        val height = drawable.intrinsicHeight.takeIf { it > 0 } ?: 180
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        drawable.setBounds(0, 0, width, height)
        drawable.draw(Canvas(bitmap))

        val png = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, png)
        return WebResourceResponse("image/png", null, ByteArrayInputStream(png.toByteArray()))
    }
}