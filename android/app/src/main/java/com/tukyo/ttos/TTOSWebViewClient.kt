package com.tukyo.ttos

import android.content.pm.ActivityInfo
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.content.res.AssetManager
import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.DisplayMetrics
import android.webkit.MimeTypeMap
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.IOException

/** Serves the UI bundled in the APK, and falls back to it when the dev server can't be reached. */
class TTOSWebViewClient(private val assets: AssetManager, private val packageManager: PackageManager) :
    WebViewClient() {
    companion object {
        const val BUNDLED_HOST: String = "appassets.androidplatform.net"
        const val BUNDLED_URL: String = "https://$BUNDLED_HOST/index.html"
    }

    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
        if (request.url.host != BUNDLED_HOST) return null
        request.url.path?.removePrefix("/banner/")?.takeIf { it != request.url.path }?.let { return bannerResponse(it) }

        val path: String = request.url.path.orEmpty().trimStart('/').ifEmpty { "index.html" }
        val mime: String? = MimeTypeMap.getSingleton().getMimeTypeFromExtension(path.substringAfterLast('.'))
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
        val drawable: Drawable = try {
            sharpestBanner(packageName)
                ?: packageManager.getLeanbackLaunchIntentForPackage(packageName)?.let { packageManager.getActivityBanner(it) }
                ?: packageManager.getApplicationBanner(packageName)
                ?: packageManager.getApplicationIcon(packageName)
        } catch (e: PackageManager.NameNotFoundException) {
            return null
        }

        val bitmap: Bitmap = (drawable as? BitmapDrawable)?.bitmap ?: drawToBitmap(drawable)
        val png = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, png)
        return WebResourceResponse("image/png", null, ByteArrayInputStream(png.toByteArray()))
    }

    /**
     * The app's banner in the highest density it ships. getActivityBanner / getApplicationBanner pick the TV's density,
     * often the smallest version. Null if the app declares no banner resource.
     */
    private fun sharpestBanner(packageName: String): Drawable? {
        val app: ApplicationInfo = packageManager.getApplicationInfo(packageName, 0)
        val activity: ActivityInfo? = packageManager.getLeanbackLaunchIntentForPackage(packageName)?.component
            ?.let { packageManager.getActivityInfo(it, 0) }
        val bannerId: Int = activity?.banner?.takeIf { it != 0 } ?: app.banner.takeIf { it != 0 } ?: return null
        return try {
            packageManager.getResourcesForApplication(app).getDrawableForDensity(bannerId, DisplayMetrics.DENSITY_XXXHIGH, null)
        } catch (e: Resources.NotFoundException) {
            null
        }
    }

    /** Draws a drawable that has no pixels of its own (e.g. a vector or an adaptive icon) at its reported size. */
    private fun drawToBitmap(drawable: Drawable): Bitmap {
        val width: Int = drawable.intrinsicWidth.takeIf { it > 0 } ?: TTOSConfig.BANNER_FALLBACK_WIDTH
        val height: Int = drawable.intrinsicHeight.takeIf { it > 0 } ?: TTOSConfig.BANNER_FALLBACK_HEIGHT
        val bitmap: Bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        drawable.setBounds(0, 0, width, height)
        drawable.draw(Canvas(bitmap))
        return bitmap
    }
}