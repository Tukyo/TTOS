import groovy.json.JsonSlurper

plugins {
    id("com.android.application")
}

/** Every TTOS value lives in ttos.config.json. Gradle reads its "app" section; Kotlin gets the whole file as BuildConfig.CONFIG_JSON (read by TTOSConfig). */
val configFile: File = rootProject.file("ttos.config.json")
val config: Map<*, *> = JsonSlurper().parse(configFile) as Map<*, *>
val app: Map<*, *> = config["app"] as Map<*, *>

/** The app's ID on the device and its code package (namespace). Kotlin reads it as BuildConfig.APPLICATION_ID. */
val appId: String = app["id"] as String

/** Android API level TTOS compiles against and targets. */
val sdk: Int = app["sdk"] as Int

/** versionCode = seconds since this moment (2026-01-01 00:00 UTC) at build time, so every build gets a higher number. */
val versionCodeEpochSeconds: Long = (app["versionCodeEpochSeconds"] as Number).toLong()

/** The whole config file as a Java string literal for BuildConfig: backslashes and quotes escaped, line breaks removed. */
val configJsonLiteral: String =
    "\"" + configFile.readText().replace("\\", "\\\\").replace("\"", "\\\"").replace("\r", "").replace("\n", "") + "\""

val webPackage: Map<*, *> = JsonSlurper().parse(rootProject.file("web/package.json")) as Map<*, *>

android {
    namespace = appId
    compileSdk = sdk

    buildFeatures {
        buildConfig = true
    }

    defaultConfig {
        applicationId = appId
        minSdk = app["minSdk"] as Int
        targetSdk = sdk
        versionCode = ((System.currentTimeMillis() / 1000) - versionCodeEpochSeconds).toInt()
        versionName = webPackage["version"] as String
        buildConfigField("String", "CONFIG_JSON", configJsonLiteral)
    }

    sourceSets {
        getByName("main") {
            assets.srcDir(rootProject.file("web/dist"))
        }
    }
}

dependencies {
    implementation("com.squareup.okhttp3:okhttp:5.3.2")
}

val buildWeb: TaskProvider<Exec> = tasks.register<Exec>("buildWeb") {
    workingDir = rootProject.file("web")
    commandLine("cmd", "/c", "npm", "run", "build")
}

/**
 * Bundles the web UI right before Android collects the app's assets (mergeDebugAssets / mergeReleaseAssets),
 * not on preBuild: the Kotlin extension's Gradle import runs preBuild, and rebuilding web/dist (an assets folder)
 * made it re-import in an endless loop.
 */
tasks.matching { it.name.startsWith("merge") && it.name.endsWith("Assets") }.configureEach {
    dependsOn(buildWeb)
}