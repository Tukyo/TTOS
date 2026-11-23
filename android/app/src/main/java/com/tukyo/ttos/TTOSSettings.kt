package com.tukyo.ttos

import android.content.Context
import android.content.SharedPreferences

/** Reads and writes TTOS's own settings on the TV (file: TTOSConfig.Prefs; keys from TTOSConfig.Prefs and TTOSConfig.LG). Used by the bridge, TTOSButtonService and TTOSLG. */
object TTOSSettings {
    /** Whether TTOS takes over Home (the Home button + covering Google's home screen). */
    fun takeOverHome(context: Context): Boolean =
        prefs(context).getBoolean(TTOSConfig.Prefs.TakeOverHome.KEY, TTOSConfig.Prefs.TakeOverHome.DEFAULT)

    fun setTakeOverHome(context: Context, on: Boolean) {
        prefs(context).edit().putBoolean(TTOSConfig.Prefs.TakeOverHome.KEY, on).apply()
    }

    /** The LG's pairing key (TTOSLG), or null until TTOS has paired with the LG once. */
    fun lgClientKey(context: Context): String? = prefs(context).getString(TTOSConfig.LG.CLIENT_KEY, null)

    fun setLgClientKey(context: Context, key: String) {
        prefs(context).edit().putString(TTOSConfig.LG.CLIENT_KEY, key).apply()
    }

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(TTOSConfig.Prefs.FILE, Context.MODE_PRIVATE)
}