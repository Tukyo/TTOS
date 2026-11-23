package com.tukyo.ttos

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import java.net.ServerSocket
import java.net.Socket
import java.net.URLDecoder
import kotlin.concurrent.thread

/**
 * The viewport: any device on the home network can send a link to the TV. TTOS serves a tiny "Send to TV" page on
 * TTOSConfig.Viewport.PORT (e.g. http://192.168.0.14:8099, from the bundled assets); sending opens the link fullscreen in
 * the TV browser (TTOSConfig.Viewport.BROWSER, TV Bro), from anywhere, even over another app (TTOS may start activities
 * from the background because its accessibility service is bound). Only devices on the local network are answered.
 * Every failure is caught and logged: if something breaks, the page just doesn't answer and TTOS runs as normal.
 */
object TTOSViewport {
    private const val TAG = "TTOSViewport"

    private var started = false

    /** Starts listening, once per app process (MainActivity can be created more than once). */
    fun start(context: Context) {
        if (started) return
        started = true
        val app: Context = context.applicationContext
        thread(name = TAG, isDaemon = true) {
            try {
                ServerSocket(TTOSConfig.Viewport.PORT).use { server ->
                    while (true) {
                        val client: Socket = server.accept()
                        thread(isDaemon = true) { answer(app, client) }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Viewport port stopped", e)
            }
        }
    }

    /** Answers one request: the page ("/"), a link to open ("/open?url=…"), or nothing. Local network only. */
    private fun answer(app: Context, client: Socket) {
        client.use {
            try {
                val address = client.inetAddress
                if (!address.isSiteLocalAddress && !address.isLoopbackAddress) return

                // First line of an HTTP request, e.g. "GET /open?url=https%3A%2F%2Fexample.com HTTP/1.1"; nothing else is needed.
                val target: String = client.inputStream.bufferedReader().readLine()?.split(" ")?.getOrNull(1) ?: return
                val path: String = target.substringBefore("?")
                val query: String = target.substringAfter("?", "")

                when (path) {
                    "/", "/${TTOSConfig.Viewport.PAGE}" -> {
                        val page: ByteArray = app.assets.open(TTOSConfig.Viewport.PAGE).use { asset -> asset.readBytes() }
                        respond(client, "200 OK", "text/html; charset=utf-8", page)
                    }

                    "/open" -> {
                        val url: String? = query.split("&")
                            .map { pair -> pair.split("=", limit = 2) }
                            .firstOrNull { pair -> pair.firstOrNull() == "url" }
                            ?.getOrNull(1)
                            ?.let { value -> URLDecoder.decode(value, "UTF-8").trim() }
                        if (url.isNullOrEmpty()) {
                            respond(client, "400 Bad Request", "text/plain", "No url".toByteArray())
                            return
                        }
                        open(app, if (url.contains("://")) url else "https://$url")
                        respond(client, "303 See Other", "text/plain", ByteArray(0), "Location: /?sent=1")
                    }

                    else -> respond(client, "404 Not Found", "text/plain", "Not found".toByteArray())
                }
            } catch (e: Exception) {
                Log.w(TAG, "Viewport request failed", e)
            }
        }
    }

    /** Opens `url` fullscreen in the TV browser; if it isn't installed, in whatever app handles links. */
    private fun open(app: Context, url: String) {
        val view: Intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            app.startActivity(Intent(view).setPackage(TTOSConfig.Viewport.BROWSER))
        } catch (e: ActivityNotFoundException) {
            app.startActivity(view)
        }
    }

    /** Writes a complete HTTP response (the connection closes afterwards). */
    private fun respond(client: Socket, status: String, type: String, body: ByteArray, extraHeader: String? = null) {
        val headers: String = buildString {
            append("HTTP/1.1 $status\r\n")
            append("Content-Type: $type\r\n")
            append("Content-Length: ${body.size}\r\n")
            if (extraHeader != null) append("$extraHeader\r\n")
            append("Connection: close\r\n\r\n")
        }
        client.outputStream.apply {
            write(headers.toByteArray())
            write(body)
            flush()
        }
    }
}
