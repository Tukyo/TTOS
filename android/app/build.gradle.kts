import groovy.json.JsonSlurper

plugins {
    id("com.android.application")
}

/** The app's ID on the device and its code package (namespace). Kotlin reads it as BuildConfig.APPLICATION_ID. */
val appId = "com.tukyo.ttos"

/** Android API level TTOS compiles against and targets. */
val sdk = 37

/** versionCode = seconds since 2026-01-01 00:00 UTC at build time, so every build gets a higher number. */
val versionCodeEpochSeconds: Long = 1767225600

val webPackage: Map<*, *> = JsonSlurper().parse(rootProject.file("web/package.json")) as Map<*, *>
val devServer: Map<*, *> =
    (JsonSlurper().parse(rootProject.file("ttos.config.json")) as Map<*, *>)["devServer"] as Map<*, *>

android {
    namespace = appId
    compileSdk = sdk

    buildFeatures {
        buildConfig = true
    }

    defaultConfig {
        applicationId = appId
        minSdk = 34
        targetSdk = sdk
        versionCode = ((System.currentTimeMillis() / 1000) - versionCodeEpochSeconds).toInt()
        versionName = webPackage["version"] as String
        buildConfigField("String", "DEV_SERVER_URL", "\"http://${devServer["host"]}:${devServer["port"]}\"")
        buildConfigField("String", "UPDATE_PATH", "\"${devServer["updatePath"]}\"")
    }

    sourceSets {
        getByName("main") {
            assets.srcDir(rootProject.file("web/dist"))
        }
    }
}

val buildWeb: TaskProvider<Exec> = tasks.register<Exec>("buildWeb") {
    workingDir = rootProject.file("web")
    commandLine("cmd", "/c", "npm", "run", "build")
}

tasks.named("preBuild") {
    dependsOn(buildWeb)
}