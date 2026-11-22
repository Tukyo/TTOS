package com.tukyo.ttos

import android.net.LocalSocket
import android.net.LocalSocketAddress
import android.os.Process
import android.util.Log
import java.io.InputStream
import java.io.OutputStream
import java.net.ServerSocket
import java.net.Socket
import kotlin.concurrent.thread

/**
 * Lets chrome://inspect reach TTOS's WebView over the network, so DevTools needs no ADB (and survives reboots).
 * The WebView's DevTools server only listens on a local socket that ADB (the shell user) or TTOS itself may connect to.
 * This opens TTOSConfig.DevTools.PORT and pipes each connection from the dev PC (TTOSConfig.DevServer.HOST) to that socket.
 * Every failure is caught and logged: if it doesn't work, DevTools just doesn't show up and TTOS runs as normal.
 */
object TTOSDevTools {
    private const val TAG = "TTOSDevTools"

    /** The WebView's DevTools socket (Chromium's name format), in TTOS's own process. */
    private val socketName = "webview_devtools_remote_${Process.myPid()}"

    private var started = false

    /** Starts listening, once per app process (MainActivity can be created more than once). */
    fun start() {
        if (started) return
        started = true
        thread(name = TAG, isDaemon = true) {
            try {
                ServerSocket(TTOSConfig.DevTools.PORT).use { server ->
                    while (true) {
                        val client: Socket = server.accept()
                        if (client.inetAddress.hostAddress == TTOSConfig.DevServer.HOST) connect(client)
                        else runCatching { client.close() }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "DevTools port stopped", e)
            }
        }
    }

    /** Connects one client to the WebView's DevTools socket and pipes both directions. */
    private fun connect(client: Socket) {
        val devTools = LocalSocket()
        try {
            devTools.connect(LocalSocketAddress(socketName, LocalSocketAddress.Namespace.ABSTRACT))
            pipe(client.inputStream, devTools.outputStream, client, devTools)
            pipe(devTools.inputStream, client.outputStream, client, devTools)
        } catch (e: Exception) {
            Log.w(TAG, "Couldn't reach the WebView's DevTools socket", e)
            close(client, devTools)
        }
    }

    /** Copies one direction on its own thread. When it ends (either side closed), closes both, which also ends the other direction. */
    private fun pipe(from: InputStream, to: OutputStream, client: Socket, devTools: LocalSocket) {
        thread(isDaemon = true) {
            runCatching { from.copyTo(to) }
            close(client, devTools)
        }
    }

    private fun close(client: Socket, devTools: LocalSocket) {
        runCatching { client.close() }
        runCatching { devTools.close() }
    }
}