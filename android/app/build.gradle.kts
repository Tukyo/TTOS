import groovy.json.JsonSlurper

plugins {
    id("com.android.application")
}

val webPackage = JsonSlurper().parse(file("../../web/package.json")) as Map<*, *>
val devServer = (JsonSlurper().parse(file("../../ttos.config.json")) as Map<*, *>)["devServer"] as Map<*, *>

android {
    namespace = "com.tukyo.ttos"
    compileSdk = 37

    buildFeatures {
        buildConfig = true
    }

    defaultConfig {
        applicationId = "com.tukyo.ttos"
        minSdk = 34
        targetSdk = 37
        versionCode = ((System.currentTimeMillis() / 1000) - 1767225600).toInt()
        versionName = webPackage["version"] as String
        buildConfigField("String", "DEV_SERVER_URL", "\"http://${devServer["host"]}:${devServer["port"]}\"")
    }

    sourceSets {
        getByName("main") {
            assets.srcDir("../../web/dist")
        }
    }
}

val buildWeb: TaskProvider<Exec> by tasks.registering(Exec::class) {
    workingDir = file("../../web")
    commandLine("cmd", "/c", "npm", "run", "build")
}

tasks.named("preBuild") {
    dependsOn(buildWeb)
}