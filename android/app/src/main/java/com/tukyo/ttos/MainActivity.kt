package com.tukyo.ttos

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
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

        /** Starts TTOS the way Android starts a home screen (MAIN + HOME). Android keeps it in its home task, so there's only ever one TTOS, and it runs its Home action. */
        fun startAsHome(context: Context) {
            context.startActivity(
                Intent(Intent.ACTION_MAIN)
                    .addCategory(Intent.CATEGORY_HOME)
                    .setClass(context, MainActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        }
    }

    private lateinit var webView: WebView

    private var konamiProgress: Int = 0
    private var lastUpdateCheck: Long = 0

    private val appsChangedReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            webView.evaluateJavascript("window.ttosRefresh?.()", null)
        }
    }

    /** Tells the web UI whenever the internet connection appears, changes or drops. Android calls this on a background thread. */
    private val networkCallback: ConnectivityManager.NetworkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) = notifyWeb()

        override fun onLost(network: Network) = notifyWeb()

        private fun notifyWeb() = runOnUiThread { webView.evaluateJavascript("window.ttosNetwork?.()", null) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        val defaultHandler: Thread.UncaughtExceptionHandler? = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread: Thread, error: Throwable ->
            startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            defaultHandler?.uncaughtException(thread, error)
        }

        super.onCreate(savedInstanceState)

        if (!intent.hasCategory(Intent.CATEGORY_HOME) && intent.action != TTOSUpdater.ACTION_INSTALL_STATUS) {
            startAsHome(this)
            finish()
            return
        }

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
        getSystemService(ConnectivityManager::class.java)?.registerDefaultNetworkCallback(networkCallback)

        if (!BuildConfig.DEBUG) {
            webView.loadUrl(TTOSConfig.BundledUi.URL)
            return
        }

        TTOSDevTools.start()

        val devUrl: String = TTOSConfig.DevServer.URL
        Thread {
            val devServerUp: Boolean = try {
                val connection: HttpURLConnection = URI(devUrl).toURL().openConnection() as HttpURLConnection
                connection.connectTimeout = TTOSConfig.DevServer.TIMEOUT_MS
                connection.readTimeout = TTOSConfig.DevServer.TIMEOUT_MS
                connection.responseCode == 200
            } catch (e: IOException) {
                false
            }
            runOnUiThread { webView.loadUrl(if (devServerUp) devUrl else TTOSConfig.BundledUi.URL) }
        }.start()
    }

    override fun onResume() {
        super.onResume()
        webView.evaluateJavascript("window.ttosRefresh?.()", null)
        val now: Long = System.currentTimeMillis()
        if (now - lastUpdateCheck < TTOSConfig.Update.CHECK_COOLDOWN_MS) return
        lastUpdateCheck = now
        checkForUpdates()
    }

    /** Checks the dev server for a newer TTOS build in the background. Shows the web "Installing update" modal if one installs. */
    fun checkForUpdates() {
        if (!BuildConfig.DEBUG) return
        Thread {
            TTOSUpdater(this, TTOSConfig.DevServer.URL) {
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
            val code: List<Int> = TTOSConfig.Remote.KONAMI_CODE
            val pressed: List<Int> = code.take(konamiProgress) + event.keyCode
            konamiProgress = (pressed.size downTo 0).first { length -> pressed.takeLast(length) == code.take(length) }
            if (konamiProgress == code.size) {
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
        if (::webView.isInitialized) {
            unregisterReceiver(appsChangedReceiver)
            getSystemService(ConnectivityManager::class.java)?.unregisterNetworkCallback(networkCallback)
            webView.destroy()
        }
        super.onDestroy()
    }
}