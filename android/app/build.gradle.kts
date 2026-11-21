plugins {
    id("com.android.application")
}

android {
    namespace = "com.tukyo.ttos"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.tukyo.ttos"
        minSdk = 34
        targetSdk = 37
        versionCode = 1
        versionName = "0.0.1"
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