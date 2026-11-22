package com.tukyo.ttos

import android.content.Context
import android.content.SharedPreferences

/** Reads and writes TTOS's own settings on the TV (file, keys and defaults: TTOSConfig.Prefs). Used by the bridge and TTOSButtonService. */
object TTOSSettings {
    /** Whether TTOS takes over Home (the Home button + covering Google's home screen). */
    fun takeOverHome(context: Context): Boolean =
        prefs(context).getBoolean(TTOSConfig.Prefs.TakeOverHome.KEY, TTOSConfig.Prefs.TakeOverHome.DEFAULT)

    fun setTakeOverHome(context: Context, on: Boolean) {
        prefs(context).edit().putBoolean(TTOSConfig.Prefs.TakeOverHome.KEY, on).apply()
    }

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(TTOSConfig.Prefs.FILE, Context.MODE_PRIVATE)
}