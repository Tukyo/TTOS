package com.tukyo.ttos

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONArray
import org.json.JSONObject
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.X509TrustManager

/**
 * Talks to the LG TV over the home network through webOS's local control API (a WebSocket carrying JSON messages).
 * Every call connects, registers with the saved pairing key, does one thing and closes.
 * The first time, the LG asks "Allow this device?" on screen; the key it returns is saved (TTOSSettings), so it never asks again.
 * Pairs with an unsigned manifest: recent LG firmware rejects the signed one every third-party app ships ("blacklisted certificate").
 */
object TTOSLG {
    private const val REGISTER_ID = "register"
    private const val LAUNCH_ID = "launch"
    private const val NORMAL_CLOSURE = 1000

    /** What TTOS asks the LG for when pairing. Unsigned pairing only gets basic permissions; launching apps is one of them. */
    private val permissions: JSONArray = JSONArray().put("LAUNCH")

    /** The LG's certificate is self-signed, so nothing can vouch for it: this accepts it as-is. The client below only ever talks to TTOSConfig.LG.HOST. */
    private val trustLG = object : X509TrustManager {
        override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
        override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
        override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
    }

    private val client: OkHttpClient = OkHttpClient.Builder()
        .sslSocketFactory(
            SSLContext.getInstance("TLS").apply { init(null, arrayOf(trustLG), null) }.socketFactory,
            trustLG
        )
        .hostnameVerifier { host, _ -> host == TTOSConfig.LG.HOST }
        .connectTimeout(TTOSConfig.LG.TIMEOUT_MS, TimeUnit.MILLISECONDS)
        .build()

    private val main = Handler(Looper.getMainLooper())

    /** Opens the LG's own Settings on screen (Star). */
    fun openSettings(context: Context) {
        launch(context, TTOSConfig.LG.SETTINGS_APP)
    }

    /** Opens app `appId` on the LG (e.g. "com.palm.app.settings"). Runs in the background; a Toast says if it failed. */
    fun launch(context: Context, appId: String) {
        val request: Request = Request.Builder().url(TTOSConfig.LG.URL).build()
        val socket: WebSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                webSocket.send(registration(TTOSSettings.lgClientKey(context)))
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                val message = JSONObject(text)
                when (message.getString("type")) {
                    "registered" -> {
                        TTOSSettings.setLgClientKey(context, message.getJSONObject("payload").getString("client-key"))
                        webSocket.send(launchRequest(appId))
                    }

                    "response" -> if (message.getString("id") == LAUNCH_ID) webSocket.close(NORMAL_CLOSURE, null)
                    "error" -> {
                        webSocket.close(NORMAL_CLOSURE, null)
                        fail(context, message.optString("error"))
                    }
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                fail(context, t.message)
            }
        })
        main.postDelayed({ socket.cancel() }, TTOSConfig.LG.PAIR_TIMEOUT_MS)
    }

    /** The "register" message: the saved pairing key if there is one (no prompt), else the LG asks "Allow this device?". */
    private fun registration(clientKey: String?): String {
        val manifest: JSONObject = JSONObject()
            .put("manifestVersion", 1)
            .put("appVersion", BuildConfig.VERSION_NAME)
            .put("deviceName", "TTOS")
            .put("permissions", permissions)
        val payload: JSONObject = JSONObject()
            .put("forcePairing", false)
            .put("pairingType", "PROMPT")
            .put("manifest", manifest)
        if (clientKey != null) payload.put("client-key", clientKey)
        return JSONObject().put("type", "register").put("id", REGISTER_ID).put("payload", payload).toString()
    }

    /** Asks the LG to open app `appId`. */
    private fun launchRequest(appId: String): String = JSONObject()
        .put("type", "request")
        .put("id", LAUNCH_ID)
        .put("uri", "ssap://system.launcher/launch")
        .put("payload", JSONObject().put("id", appId))
        .toString()

    /** Says on screen that talking to the LG failed (Toasts must be shown from the main thread). */
    private fun fail(context: Context, reason: String?) {
        main.post { Toast.makeText(context, "Couldn't reach the LG TV ($reason)", Toast.LENGTH_LONG).show() }
    }
}