#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YUGUR ONE-CELL PROJECT GENERATOR
Run this single Python file in Kaggle / Colab / VPS / local Python.
It generates a native Kotlin Android app + Rust/Axum backend + PostgreSQL schema.
It does NOT generate a WebView app and does NOT claim production readiness by itself.
"""
from __future__ import annotations
import os, sys, json, shutil, zipfile, subprocess, textwrap, hashlib
from pathlib import Path

PROJECT_NAME = "YUGUR_NATIVE"
ROOT_OVERRIDE = os.environ.get("YUGUR_OUTPUT_DIR", "").strip()
if ROOT_OVERRIDE:
    ROOT = Path(ROOT_OVERRIDE).expanduser().resolve()
elif Path("/kaggle/working").exists():
    ROOT = Path("/kaggle/working") / PROJECT_NAME
elif Path("/content").exists():
    ROOT = Path("/content") / PROJECT_NAME
else:
    ROOT = Path.cwd() / PROJECT_NAME

FILES: dict[str, str] = {}

def add(path: str, content: str) -> None:
    FILES[path] = textwrap.dedent(content).lstrip("\n")

# -----------------------------------------------------------------------------
# Root project, Gradle and Android configuration
# -----------------------------------------------------------------------------
add("README.md", r'''
# YUGUR — Native Running + Messenger foundation

This generated repository contains:

- Native Android client: Kotlin + Jetpack Compose (no WebView / HTML frontend).
- Native location foreground service using Fused Location Provider.
- MapLibre Native Android map surface.
- Rust backend: Axum + Tokio + SQLx + PostgreSQL.
- Argon2id password hashes, short-lived JWT access tokens and server-side sessions.
- REST API and user-authenticated WebSocket event stream.
- Direct conversations, group creation, channel creation, messages and run recording foundations.

## Generate

Run the single Python bootstrap file. It writes this folder and a ZIP archive.

## Backend (local development)

1. Copy `.env.example` to `.env` and set a long random `JWT_SECRET` (at least 32 bytes).
2. Start PostgreSQL:

   ```bash
   docker compose up -d db
   ```

3. Start the backend:

   ```bash
   cd backend
   set -a; source ../.env; set +a
   cargo run --release
   ```

The backend applies SQL migrations automatically at startup.

## Android

Requirements: JDK 17, Android SDK Platform 37, Android Build Tools 36, Gradle 9.6.0.

Set `YUGUR_API_BASE` in `local.properties` or Gradle project properties to an HTTPS API base URL ending with `/`.
For Android emulator development, configure a debug-only HTTPS tunnel or your LAN HTTPS endpoint. The release app does not enable cleartext HTTP.

```bash
cd android
# If Gradle is installed:
gradle wrapper --gradle-version 9.6.0
./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Important production work still required

This is a strong, compilable project foundation—not a finished public messenger service.
Before public release, add and test: E2EE using an audited protocol/library, object-storage uploads and private media authorization, push notifications, moderation/report flows, account recovery, rate limiting/WAF, backups, observability, privacy/legal flows, Play Integrity server verification, full run anti-cheat scoring, and device/OS matrix testing. Never advertise E2EE until it has been independently reviewed and verified.

## GPS accuracy

No phone can guarantee zero-meter GPS error. The app retains accuracy metadata and rejects obviously poor/jumping fixes; real-world performance depends on handset GNSS hardware, sky visibility, buildings and power policy.

## Security notes

- Use HTTPS/WSS behind a correctly configured reverse proxy.
- Set a unique, high-entropy JWT secret outside source control.
- Do not expose PostgreSQL publicly.
- Configure explicit production CORS origins; the sample backend is development-oriented.
- Never put secrets or signing keys into the repository.
- Review all Android permissions and Play Console declarations before release.
''')

add(".gitignore", r'''
.env
local.properties
.gradle/
**/build/
**/.idea/
*.jks
*.keystore
*.apk
*.aab
backend/target/
''')

add(".env.example", r'''
DATABASE_URL=postgres://yugur:yugur_dev_only_change_me@127.0.0.1:5432/yugur
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_SECRET_AT_LEAST_32_BYTES_LONG
HOST=0.0.0.0
PORT=8080
RUST_LOG=info
''')

add("docker-compose.yml", r'''
services:
  db:
    image: postgres:17-alpine
    container_name: yugur-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: yugur
      POSTGRES_USER: yugur
      POSTGRES_PASSWORD: yugur_dev_only_change_me
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - yugur_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U yugur -d yugur"]
      interval: 5s
      timeout: 3s
      retries: 20
volumes:
  yugur_pgdata:
''')

add("android/settings.gradle.kts", r'''
pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories { google(); mavenCentral() }
}
rootProject.name = "YUGUR"
include(":app")
''')

add("android/build.gradle.kts", r'''
plugins {
    id("com.android.application") version "9.5.0" apply false
    id("org.jetbrains.kotlin.android") version "2.4.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.4.21" apply false
}
''')

add("android/gradle.properties", r'''
org.gradle.jvmargs=-Xmx4g -Dfile.encoding=UTF-8 -XX:+UseParallelGC
org.gradle.parallel=true
org.gradle.caching=true
android.useAndroidX=true
kotlin.code.style=official
''')

add("android/gradle/wrapper/gradle-wrapper.properties", r'''
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-9.6.0-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
''')

add("android/gradle/libs.versions.toml", r'''
[versions]
composeBom = "2026.09.00"
coreKtx = "1.17.0"
activityCompose = "1.12.2"
lifecycle = "2.10.0"
coroutines = "1.10.2"
retrofit = "2.11.0"
okhttp = "4.12.0"
gson = "2.11.0"
location = "21.4.0"
maplibre = "13.5.4"

[libraries]
androidx-core-ktx = { module = "androidx.core:core-ktx", version.ref = "coreKtx" }
androidx-activity-compose = { module = "androidx.activity:activity-compose", version.ref = "activityCompose" }
androidx-lifecycle-runtime-compose = { module = "androidx.lifecycle:lifecycle-runtime-compose", version.ref = "lifecycle" }
androidx-compose-bom = { module = "androidx.compose:compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { module = "androidx.compose.ui:ui" }
androidx-compose-ui-tooling = { module = "androidx.compose.ui:ui-tooling" }
androidx-compose-foundation = { module = "androidx.compose.foundation:foundation" }
androidx-compose-material3 = { module = "androidx.compose.material3:material3" }
androidx-compose-ui-tooling-preview = { module = "androidx.compose.ui:ui-tooling-preview" }
play-services-location = { module = "com.google.android.gms:play-services-location", version.ref = "location" }
maplibre-android = { module = "org.maplibre.gl:android-sdk", version.ref = "maplibre" }
retrofit = { module = "com.squareup.retrofit2:retrofit", version.ref = "retrofit" }
retrofit-gson = { module = "com.squareup.retrofit2:converter-gson", version.ref = "retrofit" }
okhttp = { module = "com.squareup.okhttp3:okhttp", version.ref = "okhttp" }
gson = { module = "com.google.code.gson:gson", version.ref = "gson" }
coroutines-android = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-android", version.ref = "coroutines" }
''')

add("android/app/build.gradle.kts", r'''
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

val localProps = java.util.Properties().apply {
    val propsFile = rootProject.file("local.properties")
    if (propsFile.exists()) propsFile.inputStream().use { load(it) }
}
val configuredApi = (project.findProperty("YUGUR_API_BASE") as String?) ?: localProps.getProperty("YUGUR_API_BASE") ?: "https://api.example.invalid/"
val configuredMapStyle = (project.findProperty("YUGUR_MAP_STYLE") as String?) ?: localProps.getProperty("YUGUR_MAP_STYLE") ?: "https://demotiles.maplibre.org/style.json"

android {
    namespace = "uz.yugur.app"
    compileSdk = 37
    defaultConfig {
        applicationId = "uz.yugur.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
        buildConfigField("String", "API_BASE_URL", "\"$configuredApi\"")
        buildConfigField("String", "MAP_STYLE_URL", "\"$configuredMapStyle\"")
    }
    buildFeatures { compose = true; buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    packaging { resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" } }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.foundation)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui.tooling.preview)
    debugImplementation(libs.androidx.compose.ui.tooling)
    implementation(libs.play.services.location)
    implementation(libs.maplibre.android)
    implementation(libs.retrofit)
    implementation(libs.retrofit.gson)
    implementation(libs.okhttp)
    implementation(libs.gson)
    implementation(libs.coroutines.android)
}
''')

add("android/app/src/main/AndroidManifest.xml", r'''
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
    <application
        android:allowBackup="false"
        android:usesCleartextTraffic="false"
        android:label="YUGUR"
        android:theme="@android:style/Theme.Material.Light.NoActionBar"
        android:supportsRtl="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <service
            android:name=".location.RunLocationService"
            android:exported="false"
            android:foregroundServiceType="location" />
    </application>
</manifest>
''')

# -----------------------------------------------------------------------------
# Android client source
# -----------------------------------------------------------------------------
add("android/app/src/main/java/uz/yugur/app/data/Api.kt", r'''
package uz.yugur.app.data

import com.google.gson.GsonBuilder
import com.google.gson.annotations.SerializedName
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import java.util.UUID
import java.util.concurrent.TimeUnit

object SessionStore {
    @Volatile var token: String? = null
        private set
    private const val PREF = "yugur_session"
    private const val KEY = "access_token"

    fun load(context: android.content.Context) {
        token = context.getSharedPreferences(PREF, android.content.Context.MODE_PRIVATE).getString(KEY, null)
    }
    fun save(context: android.content.Context, value: String) {
        // Production note: replace this simple bootstrap storage with Keystore-backed encrypted storage.
        context.getSharedPreferences(PREF, android.content.Context.MODE_PRIVATE).edit().putString(KEY, value).apply()
        token = value
    }
    fun clear(context: android.content.Context) {
        context.getSharedPreferences(PREF, android.content.Context.MODE_PRIVATE).edit().remove(KEY).apply()
        token = null
    }
}

data class AuthRequest(val username: String, val password: String, val displayName: String? = null)
data class UserDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val bio: String? = null
)
data class AuthResponse(val ok: Boolean, val token: String?, val user: UserDto?, val error: String? = null)
data class MeResponse(val ok: Boolean, val user: UserDto?)
data class ConversationDto(val id: String, val kind: String, val title: String?, val updatedAt: String?)
data class ConversationsResponse(val ok: Boolean, val conversations: List<ConversationDto>)
data class MessageDto(val id: String, val senderId: String, val body: String, val createdAt: String, val clientId: String?)
data class MessagesResponse(val ok: Boolean, val messages: List<MessageDto>)
data class MessageRequest(val body: String, val clientId: String = UUID.randomUUID().toString())
data class CreateConversationRequest(val peerUserId: String)
data class SimpleResponse(val ok: Boolean, val id: String? = null, val error: String? = null)
data class RunRequest(val distanceMeters: Double, val durationSeconds: Long, val routePoints: List<List<Double>>)

interface YugurService {
    @POST("v1/auth/register") suspend fun register(@Body request: AuthRequest): Response<AuthResponse>
    @POST("v1/auth/login") suspend fun login(@Body request: AuthRequest): Response<AuthResponse>
    @POST("v1/auth/logout") suspend fun logout(): Response<SimpleResponse>
    @GET("v1/me") suspend fun me(): Response<MeResponse>
    @GET("v1/conversations") suspend fun conversations(): Response<ConversationsResponse>
    @POST("v1/conversations") suspend fun createConversation(@Body request: CreateConversationRequest): Response<SimpleResponse>
    @GET("v1/conversations/{id}/messages") suspend fun messages(@Path("id") id: String): Response<MessagesResponse>
    @POST("v1/conversations/{id}/messages") suspend fun sendMessage(@Path("id") id: String, @Body request: MessageRequest): Response<SimpleResponse>
    @POST("v1/groups") suspend fun createGroup(@Body body: Map<String, Any>): Response<SimpleResponse>
    @POST("v1/channels") suspend fun createChannel(@Body body: Map<String, Any>): Response<SimpleResponse>
    @POST("v1/runs") suspend fun saveRun(@Body request: RunRequest): Response<SimpleResponse>
}

object ApiClient {
    private val authInterceptor = Interceptor { chain ->
        val request = chain.request().newBuilder().apply {
            SessionStore.token?.let { header("Authorization", "Bearer $it") }
        }.build()
        chain.proceed(request)
    }
    val http = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()
    val service: YugurService by lazy {
        val gson = GsonBuilder().create()
        Retrofit.Builder().baseUrl(uz.yugur.app.BuildConfig.API_BASE_URL)
            .client(http).addConverterFactory(GsonConverterFactory.create(gson)).build()
            .create(YugurService::class.java)
    }
    fun connectEvents(onEvent: (String) -> Unit): WebSocket? {
        val token = SessionStore.token ?: return null
        val base = uz.yugur.app.BuildConfig.API_BASE_URL
        val wsBase = base.replaceFirst("https://", "wss://").replaceFirst("http://", "ws://")
        val request = Request.Builder().url(wsBase + "v1/ws")
            .header("Authorization", "Bearer $token").build()
        return http.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) = onEvent(text)
        })
    }
}
''')

add("android/app/src/main/java/uz/yugur/app/location/RunState.kt", r'''
package uz.yugur.app.location

import android.location.Location
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.*

data class RunSnapshot(
    val active: Boolean = false,
    val distanceMeters: Double = 0.0,
    val elapsedSeconds: Long = 0,
    val currentSpeedMps: Double = 0.0,
    val accuracyMeters: Float = 0f,
    val acceptedPoints: List<List<Double>> = emptyList(),
    val gpsStatus: String = "GPS tayyor emas"
)

object RunState {
    private val mutable = MutableStateFlow(RunSnapshot())
    val state = mutable.asStateFlow()
    private var previous: Location? = null
    private var startElapsedNanos: Long = 0
    private var lastAcceptedElapsedNanos: Long = 0

    @Synchronized fun start() {
        previous = null
        startElapsedNanos = android.os.SystemClock.elapsedRealtimeNanos()
        lastAcceptedElapsedNanos = 0
        mutable.value = RunSnapshot(active = true, gpsStatus = "GPS signal kutilmoqda")
    }
    @Synchronized fun stop() { mutable.value = mutable.value.copy(active = false) }
    @Synchronized fun ingest(location: Location) {
        val accuracy = if (location.hasAccuracy()) location.accuracy else 999f
        if (accuracy > 60f) {
            mutable.value = mutable.value.copy(accuracyMeters = accuracy, gpsStatus = "GPS aniqligi past")
            return
        }
        val old = previous
        if (old != null) {
            val dt = (location.elapsedRealtimeNanos - old.elapsedRealtimeNanos) / 1e9
            if (dt <= 0.0) return
            val delta = old.distanceTo(location).toDouble()
            val plausibleSpeed = delta / dt
            // Reject a single implausible jump; do not add fabricated interpolated distance.
            if (delta > 100.0 || plausibleSpeed > 12.5) {
                mutable.value = mutable.value.copy(accuracyMeters = accuracy, gpsStatus = "Shubhali GPS nuqta tashlandi")
                return
            }
            if (delta >= max(1.0, accuracy * 0.10)) {
                val points = (mutable.value.acceptedPoints + listOf(listOf(location.longitude, location.latitude))).takeLast(20000)
                mutable.value = mutable.value.copy(
                    distanceMeters = mutable.value.distanceMeters + delta,
                    currentSpeedMps = if (location.hasSpeed()) location.speed.toDouble() else plausibleSpeed,
                    accuracyMeters = accuracy,
                    acceptedPoints = points,
                    gpsStatus = if (accuracy <= 10f) "GPS juda yaxshi" else if (accuracy <= 25f) "GPS yaxshi" else "GPS o‘rtacha"
                )
                previous = location
                lastAcceptedElapsedNanos = location.elapsedRealtimeNanos
                return
            }
        } else {
            mutable.value = mutable.value.copy(
                acceptedPoints = listOf(listOf(location.longitude, location.latitude)),
                accuracyMeters = accuracy,
                gpsStatus = if (accuracy <= 10f) "GPS juda yaxshi" else "GPS ulandi"
            )
        }
        previous = location
        lastAcceptedElapsedNanos = location.elapsedRealtimeNanos
    }
    @Synchronized fun tick() {
        if (!mutable.value.active || startElapsedNanos == 0L) return
        val elapsed = ((android.os.SystemClock.elapsedRealtimeNanos() - startElapsedNanos) / 1_000_000_000L).coerceAtLeast(0)
        mutable.value = mutable.value.copy(elapsedSeconds = elapsed)
    }
}
''')

add("android/app/src/main/java/uz/yugur/app/location/RunLocationService.kt", r'''
package uz.yugur.app.location

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*

class RunLocationService : Service() {
    private lateinit var fused: FusedLocationProviderClient
    private lateinit var callback: LocationCallback
    private val channelId = "yugur_running"

    override fun onCreate() {
        super.onCreate()
        fused = LocationServices.getFusedLocationProviderClient(this)
        createChannel()
        callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.locations.forEach { RunState.ingest(it) }
                RunState.tick()
                val s = RunState.state.value
                val notification = notification("${"%.2f".format(s.distanceMeters / 1000.0)} km  •  ${s.elapsedSeconds}s")
                (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(1001, notification)
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> stopTracking()
            else -> startTracking()
        }
        return START_STICKY
    }

    private fun startTracking() {
        val hasFine = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (!hasFine && !hasCoarse) { stopSelf(); return }
        val n = notification("GPS signal kutilmoqda")
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(1001, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        } else startForeground(1001, n)
        if (!RunState.state.value.active) RunState.start()
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 1000L)
            .setMinUpdateIntervalMillis(500L)
            .setMinUpdateDistanceMeters(1f)
            .setWaitForAccurateLocation(false)
            .build()
        try { fused.requestLocationUpdates(request, callback, Looper.getMainLooper()) }
        catch (_: SecurityException) { stopSelf() }
    }

    private fun stopTracking() {
        try { fused.removeLocationUpdates(callback) } catch (_: Exception) { }
        RunState.stop()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(NotificationChannel(channelId, "Yugurish", NotificationManager.IMPORTANCE_LOW))
        }
    }
    private fun notification(text: String): Notification = NotificationCompat.Builder(this, channelId)
        .setSmallIcon(android.R.drawable.ic_media_play)
        .setContentTitle("YUGUR — yugurish davom etmoqda")
        .setContentText(text)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .build()

    override fun onBind(intent: Intent?): IBinder? = null
    companion object {
        const val ACTION_START = "uz.yugur.app.RUN_START"
        const val ACTION_STOP = "uz.yugur.app.RUN_STOP"
    }
}
''')

add("android/app/src/main/java/uz/yugur/app/MainActivity.kt", r'''
package uz.yugur.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import uz.yugur.app.data.*
import uz.yugur.app.location.*
import org.maplibre.android.MapLibre
import org.maplibre.android.maps.MapView
import java.util.Locale

private val Ink = Color(0xFF07110F)
private val Panel = Color(0xFF111F1B)
private val Lime = Color(0xFFB7F36B)
private val Mint = Color(0xFF38D6A6)
private val Muted = Color(0xFF91A69D)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        SessionStore.load(this)
        MapLibre.getInstance(this)
        setContent { YugurRoot() }
    }
}

@Composable
private fun YugurRoot() {
    val context = LocalContext.current
    var authenticated by remember { mutableStateOf(!SessionStore.token.isNullOrBlank()) }
    MaterialTheme(colorScheme = darkColorScheme(
        primary = Lime, secondary = Mint, background = Ink, surface = Panel,
        onPrimary = Ink, onBackground = Color.White, onSurface = Color.White
    )) {
        Surface(Modifier.fillMaxSize(), color = Ink) {
            if (authenticated) MainShell(onLogout = {
                SessionStore.clear(context); authenticated = false
            }) else AuthScreen(onSuccess = { token ->
                SessionStore.save(context, token); authenticated = true
            })
        }
    }
}

@Composable
private fun AuthScreen(onSuccess: (String) -> Unit) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var displayName by remember { mutableStateOf("") }
    var isRegister by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("YUGUR", fontSize = 42.sp, fontWeight = FontWeight.Black, color = Lime)
        Text("Har bir qadam — yangi natija.", color = Muted, modifier = Modifier.padding(bottom = 30.dp))
        Text(if (isRegister) "Hisob yaratish" else "Xush kelibsiz", fontSize = 25.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(18.dp))
        if (isRegister) OutlinedTextField(displayName, { displayName = it }, label = { Text("Ismingiz") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(username, { username = it }, label = { Text("Username") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(password, { password = it }, label = { Text("Parol (kamida 12 belgi)") }, modifier = Modifier.fillMaxWidth())
        if (error.isNotBlank()) Text(error, color = Color(0xFFFF7A7A), modifier = Modifier.padding(top = 8.dp))
        Spacer(Modifier.height(16.dp))
        Button(onClick = {
            if (loading) return@Button
            loading = true; error = ""
            scope.launch {
                try {
                    val req = AuthRequest(username.trim(), password, displayName.trim().ifBlank { username.trim() })
                    val response = withContext(Dispatchers.IO) {
                        if (isRegister) ApiClient.service.register(req) else ApiClient.service.login(req)
                    }
                    val body = response.body()
                    if (response.isSuccessful && body?.ok == true && !body.token.isNullOrBlank()) onSuccess(body.token)
                    else error = body?.error ?: "Kirish amalga oshmadi (${response.code()})"
                } catch (e: Exception) { error = "Serverga ulanib bo‘lmadi: ${e.message ?: "network error"}" }
                finally { loading = false }
            }
        }, enabled = !loading && username.length >= 3 && password.length >= 12, modifier = Modifier.fillMaxWidth().height(54.dp)) {
            Text(if (loading) "KUTILMOQDA..." else if (isRegister) "RO‘YXATDAN O‘TISH" else "KIRISH", fontWeight = FontWeight.Bold)
        }
        TextButton(onClick = { isRegister = !isRegister; error = "" }) {
            Text(if (isRegister) "Hisobingiz bormi? Kirish" else "Yangi foydalanuvchimisiz? Ro‘yxatdan o‘tish")
        }
        Text("Server URL android/local.properties orqali sozlanadi.", color = Muted, fontSize = 11.sp)
    }
}

private enum class Tab(val label: String, val icon: String) {
    HOME("Bosh sahifa", "⌂"), RUN("Yugurish", "➤"), CHAT("Messenger", "✉"), MAP("Xarita", "◎"), PROFILE("Profil", "◉")
}

@Composable
private fun MainShell(onLogout: () -> Unit) {
    var tab by remember { mutableStateOf(Tab.HOME) }
    Scaffold(containerColor = Ink, bottomBar = {
        NavigationBar(containerColor = Panel, contentColor = Lime) {
            Tab.values().forEach { item ->
                NavigationBarItem(selected = tab == item, onClick = { tab = item },
                    icon = { Text(item.icon, fontSize = 20.sp) }, label = { Text(item.label, fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = Ink, selectedTextColor = Lime,
                        indicatorColor = Lime, unselectedIconColor = Muted, unselectedTextColor = Muted))
            }
        }
    }) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (tab) {
                Tab.HOME -> HomeScreen(onRun = { tab = Tab.RUN }, onChat = { tab = Tab.CHAT })
                Tab.RUN -> RunScreen()
                Tab.CHAT -> MessengerScreen()
                Tab.MAP -> MapScreen()
                Tab.PROFILE -> ProfileScreen(onLogout)
            }
        }
    }
}

@Composable
private fun PageTitle(title: String, subtitle: String? = null) {
    Column(Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
        Text(title, fontSize = 27.sp, fontWeight = FontWeight.Black, color = Color.White)
        if (subtitle != null) Text(subtitle, color = Muted, fontSize = 13.sp)
    }
}

@Composable
private fun MetricCard(title: String, value: String, unit: String) {
    Column(Modifier.padding(5.dp).background(Panel, RoundedCornerShape(18.dp)).padding(15.dp).widthIn(min = 90.dp)) {
        Text(title, color = Muted, fontSize = 11.sp)
        Text(value, color = Lime, fontSize = 25.sp, fontWeight = FontWeight.ExtraBold)
        Text(unit, color = Muted, fontSize = 11.sp)
    }
}

@Composable
private fun HomeScreen(onRun: () -> Unit, onChat: () -> Unit) {
    val run by RunState.state.collectAsState()
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        PageTitle("Bugun ham oldinga.", "YUGUR — yugurish va hamjamiyat")
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            MetricCard("Masofa", String.format(Locale.US, "%.2f", run.distanceMeters / 1000.0), "km")
            MetricCard("Vaqt", formatTime(run.elapsedSeconds), "soat:min:sek")
            MetricCard("Tezlik", String.format(Locale.US, "%.1f", run.currentSpeedMps * 3.6), "km/soat")
        }
        Spacer(Modifier.height(18.dp))
        ActionCard("YUGURISHNI BOSHLASH", "Aniq GPS, real marshrut va statistika", onRun)
        ActionCard("MESSENGER", "Do‘stlar, guruhlar va kanallar", onChat)
        Card(Modifier.padding(16.dp).fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Panel)) {
            Column(Modifier.padding(18.dp)) {
                Text("YUGUR", color = Lime, fontWeight = FontWeight.Black, fontSize = 18.sp)
                Text("Natijalarni qayd eting, do‘stlaringiz bilan ulashing va o‘z profilingizni yarating.", color = Muted)
            }
        }
    }
}

@Composable
private fun ActionCard(title: String, text: String, onClick: () -> Unit) {
    Card(Modifier.padding(horizontal = 16.dp, vertical = 7.dp).fillMaxWidth().clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Panel), shape = RoundedCornerShape(20.dp)) {
        Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(title, color = Lime, fontWeight = FontWeight.Bold)
                Text(text, color = Muted, fontSize = 12.sp)
            }
            Text("→", fontSize = 28.sp, color = Lime)
        }
    }
}

@Composable
private fun RunScreen() {
    val context = LocalContext.current
    val run by RunState.state.collectAsState()
    var message by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val permissions = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
        val granted = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true || grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (granted) ContextCompat.startForegroundService(context, Intent(context, RunLocationService::class.java).setAction(RunLocationService.ACTION_START))
        else message = "GPS ruxsati berilmadi"
    }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()), horizontalAlignment = Alignment.CenterHorizontally) {
        PageTitle("Yugurish", "GPS holati va jonli statistika")
        Spacer(Modifier.height(12.dp))
        Text(String.format(Locale.US, "%.2f", run.distanceMeters / 1000.0), fontSize = 64.sp, fontWeight = FontWeight.Black, color = Lime)
        Text("KILOMETR", color = Muted, letterSpacing = 3.sp)
        Spacer(Modifier.height(22.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            MetricCard("Vaqt", formatTime(run.elapsedSeconds), "soat:min:sek")
            MetricCard("Tezlik", String.format(Locale.US, "%.1f", run.currentSpeedMps * 3.6), "km/soat")
        }
        Spacer(Modifier.height(20.dp))
        Text(run.gpsStatus, color = if (run.accuracyMeters <= 20f) Lime else Muted, fontWeight = FontWeight.Bold)
        Text(if (run.accuracyMeters > 0) "Aniqlik: ±${run.accuracyMeters.toInt()} m" else "Aniqlik kutilmoqda", color = Muted)
        Spacer(Modifier.height(25.dp))
        Button(onClick = {
            if (run.active) {
                val finished = RunState.state.value
                context.startService(Intent(context, RunLocationService::class.java).setAction(RunLocationService.ACTION_STOP))
                scope.launch {
                    try {
                        withContext(Dispatchers.IO) {
                            ApiClient.service.saveRun(RunRequest(finished.distanceMeters, finished.elapsedSeconds, finished.acceptedPoints))
                        }
                        message = "Yugurish serverga saqlandi"
                    } catch (e: Exception) { message = "Yugurish telefonda yakunlandi; serverga saqlanmadi: ${e.message}" }
                }
            } else {
                val needed = mutableListOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
                if (Build.VERSION.SDK_INT >= 33) needed.add(Manifest.permission.POST_NOTIFICATIONS)
                val missing = needed.filter { ContextCompat.checkSelfPermission(context, it) != PackageManager.PERMISSION_GRANTED }
                if (missing.isEmpty()) ContextCompat.startForegroundService(context, Intent(context, RunLocationService::class.java).setAction(RunLocationService.ACTION_START))
                else permissions.launch(missing.toTypedArray())
            }
        }, modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp).height(58.dp), colors = ButtonDefaults.buttonColors(containerColor = if (run.active) Color(0xFFFF6464) else Lime)) {
            Text(if (run.active) "YUGURISHNI TO‘XTATISH" else "BOSHLASH", color = Ink, fontWeight = FontWeight.Black)
        }
        if (message.isNotBlank()) Text(message, color = Color.Red)
        Text("GPS sifati telefon va atrof-muhitga bog‘liq. Zaif nuqtalar masofaga qo‘shilmaydi.", color = Muted, fontSize = 11.sp, modifier = Modifier.padding(20.dp))
    }
}

@Composable
private fun MessengerScreen() {
    var chats by remember { mutableStateOf<List<ConversationDto>>(emptyList()) }
    var selected by remember { mutableStateOf<ConversationDto?>(null) }
    var peerId by remember { mutableStateOf("") }
    var groupName by remember { mutableStateOf("") }
    var channelName by remember { mutableStateOf("") }
    var feedback by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    suspend fun reload() {
        try { val r = withContext(Dispatchers.IO) { ApiClient.service.conversations() }; if (r.isSuccessful) chats = r.body()?.conversations ?: emptyList() }
        catch (e: Exception) { feedback = "Chatlar yuklanmadi: ${e.message}" }
    }
    LaunchedEffect(Unit) { reload() }
    DisposableEffect(Unit) {
        val socket = ApiClient.connectEvents { scope.launch { reload() } }
        onDispose { socket?.close(1000, "screen closed") }
    }
    if (selected == null) {
        Column(Modifier.fillMaxSize()) {
            PageTitle("Messenger", "Shaxsiy chatlar • guruhlar • kanallar")
            Column(Modifier.padding(horizontal = 16.dp)) {
                OutlinedTextField(peerId, { peerId = it }, label = { Text("Yangi chat: foydalanuvchi UUID") }, modifier = Modifier.fillMaxWidth())
                Button(onClick = { scope.launch { try { withContext(Dispatchers.IO) { ApiClient.service.createConversation(CreateConversationRequest(peerId.trim())) }; peerId = ""; reload() } catch (e: Exception) { feedback = e.message ?: "Xato" } } }) { Text("CHAT OCHISH") }
                OutlinedTextField(groupName, { groupName = it }, label = { Text("Guruh nomi") }, modifier = Modifier.fillMaxWidth())
                Button(onClick = { scope.launch { try { withContext(Dispatchers.IO) { ApiClient.service.createGroup(mapOf("name" to groupName)) }; groupName = ""; reload() } catch (e: Exception) { feedback = e.message ?: "Xato" } } }) { Text("GURUH YARATISH") }
                OutlinedTextField(channelName, { channelName = it }, label = { Text("Kanal nomi") }, modifier = Modifier.fillMaxWidth())
                Button(onClick = { scope.launch { try { withContext(Dispatchers.IO) { ApiClient.service.createChannel(mapOf("name" to channelName, "isPublic" to true)) }; channelName = ""; feedback = "Kanal yaratildi" } catch (e: Exception) { feedback = e.message ?: "Xato" } } }) { Text("KANAL YARATISH") }
            }
            if (feedback.isNotBlank()) Text(feedback, color = Muted, modifier = Modifier.padding(12.dp))
            LazyColumn {
                items(chats, key = { it.id }) { c ->
                    ListItem(headlineContent = { Text(c.title ?: if (c.kind == "direct") "Shaxsiy chat" else c.kind.uppercase()) },
                        supportingContent = { Text(c.kind) }, modifier = Modifier.clickable { selected = c },
                        colors = ListItemDefaults.colors(containerColor = Ink, headlineColor = Color.White, supportingColor = Muted))
                    HorizontalDivider(color = Panel)
                }
            }
        }
    } else {
        ChatThread(selected!!, onBack = { selected = null })
    }
}

@Composable
private fun ChatThread(conversation: ConversationDto, onBack: () -> Unit) {
    var messages by remember { mutableStateOf<List<MessageDto>>(emptyList()) }
    var input by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    suspend fun reload() {
        try { val r = withContext(Dispatchers.IO) { ApiClient.service.messages(conversation.id) }; if (r.isSuccessful) messages = r.body()?.messages ?: emptyList() }
        catch (e: Exception) { error = e.message ?: "Xato" }
    }
    LaunchedEffect(conversation.id) { reload() }
    DisposableEffect(conversation.id) {
        val socket = ApiClient.connectEvents { scope.launch { reload() } }
        onDispose { socket?.close(1000, "thread closed") }
    }
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().background(Panel).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("‹", color = Lime, fontSize = 28.sp, modifier = Modifier.clickable(onClick = onBack).padding(end = 12.dp))
            Text(conversation.title ?: "YUGUR chat", color = Color.White, fontWeight = FontWeight.Bold)
        }
        LazyColumn(Modifier.weight(1f).fillMaxWidth().padding(12.dp), reverseLayout = false) {
            items(messages, key = { it.id }) { m ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), colors = CardDefaults.cardColors(containerColor = Panel)) {
                    Text(m.body, color = Color.White, modifier = Modifier.padding(12.dp))                }
            }
        }
        if (error.isNotBlank()) Text(error, color = Color(0xFFFF7777))
        Row(Modifier.fillMaxWidth().padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(input, { input = it }, modifier = Modifier.weight(1f), placeholder = { Text("Xabar yozing...") }, maxLines = 4)
            Spacer(Modifier.width(8.dp))
            Button(onClick = {
                val body = input.trim(); if (body.isNotEmpty()) scope.launch {
                    try {
                        withContext(Dispatchers.IO) { ApiClient.service.sendMessage(conversation.id, MessageRequest(body)) }
                        input = ""; reload()
                    } catch (e: Exception) { error = e.message ?: "Yuborilmadi" }
                }
            }) { Text("➤") }
        }
    }
}

@Composable
private fun MapScreen() {
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val mapView = remember { mutableStateOf<MapView?>(null) }
    AndroidView(modifier = Modifier.fillMaxSize(), factory = { context ->
        MapView(context).also { view ->
            mapView.value = view
            view.onCreate(null)
            view.getMapAsync { map -> map.setStyle(BuildConfig.MAP_STYLE_URL) }
        }
    })
    DisposableEffect(lifecycle, mapView.value) {
        val view = mapView.value
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> view?.onStart()
                Lifecycle.Event.ON_RESUME -> view?.onResume()
                Lifecycle.Event.ON_PAUSE -> view?.onPause()
                Lifecycle.Event.ON_STOP -> view?.onStop()
                Lifecycle.Event.ON_DESTROY -> view?.onDestroy()
                else -> Unit
            }
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer); view?.onDestroy(); mapView.value = null }
    }
    Box(Modifier.fillMaxWidth().padding(12.dp).align(Alignment.TopCenter)) {
        Text("MapLibre Native • Xarita uslubi sozlanadi", color = Color.White, modifier = Modifier.background(Panel, RoundedCornerShape(12.dp)).padding(10.dp))
    }
}

@Composable
private fun ProfileScreen(onLogout: () -> Unit) {
    var username by remember { mutableStateOf("Yuklanmoqda...") }
    var bio by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    LaunchedEffect(Unit) {
        try {
            val r = withContext(Dispatchers.IO) { ApiClient.service.me() }
            if (r.isSuccessful) { username = r.body()?.user?.displayName ?: "YUGUR user"; bio = r.body()?.user?.bio.orEmpty() }
            else error = "Profil yuklanmadi (${r.code()})"
        } catch (e: Exception) { error = e.message ?: "Server xatosi" }
    }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp)) {
        PageTitle("Profil", "Shaxsiy sahifangiz")
        Box(Modifier.size(92.dp).background(Lime, CircleShape), contentAlignment = Alignment.Center) {
            Text(username.take(1).uppercase(), color = Ink, fontSize = 36.sp, fontWeight = FontWeight.Black)
        }
        Text(username, fontSize = 25.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 12.dp))
        Text(bio.ifBlank { "Bio hali qo‘shilmagan" }, color = Muted)
        if (error.isNotBlank()) Text(error, color = Color.Red)
        Spacer(Modifier.height(24.dp))
        Text("Profil bezaklari, avatar, cover va maxfiylik sozlamalari keyingi modulda ulanadi.", color = Muted)
        Spacer(Modifier.height(24.dp))
        OutlinedButton(onClick = onLogout) { Text("CHIQISH") }
    }
}

private fun formatTime(total: Long): String {
    val h = total / 3600; val m = (total % 3600) / 60; val s = total % 60
    return String.format(Locale.US, "%02d:%02d:%02d", h, m, s)
}
''')

# -----------------------------------------------------------------------------
# Rust backend and SQL schema
# -----------------------------------------------------------------------------
add("backend/Cargo.toml", r'''
[package]
name = "yugur-backend"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = { version = "0.8.9", features = ["ws", "macros"] }
tokio = { version = "1.47.1", features = ["full"] }
serde = { version = "1.0.219", features = ["derive"] }
serde_json = "1.0.143"
sqlx = { version = "0.8.6", features = ["runtime-tokio-rustls", "postgres", "uuid", "chrono", "json", "migrate", "macros"] }
argon2 = "0.5.3"
rand_core = { version = "0.6.4", features = ["getrandom"] }
jsonwebtoken = "9.3.1"
uuid = { version = "1.18.1", features = ["v4", "serde"] }
chrono = { version = "0.4.42", features = ["serde"] }
dashmap = "6.1.0"
futures-util = "0.3.31"
tower-http = { version = "0.6.6", features = ["cors", "trace", "limit"] }
tracing = "0.1.41"
tracing-subscriber = { version = "0.3.20", features = ["env-filter"] }
dotenvy = "0.15.7"
''')

add("backend/migrations/0001_init.sql", r'''
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(24) NOT NULL UNIQUE,
    display_name VARCHAR(48) NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    bio VARCHAR(240) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR(16) NOT NULL CHECK (kind IN ('direct','group')),
    title VARCHAR(80),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS conversation_members (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS conversation_members_user_idx ON conversation_members(user_id);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    body VARCHAR(4000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(sender_id, client_id)
);
CREATE INDEX IF NOT EXISTS messages_conversation_time_idx ON messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS channel_members (
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL DEFAULT 'subscriber',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    distance_m DOUBLE PRECISION NOT NULL CHECK (distance_m >= 0),
    duration_seconds BIGINT NOT NULL CHECK (duration_seconds >= 0),
    route_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    flagged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS runs_user_time_idx ON runs(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body VARCHAR(2000) NOT NULL DEFAULT '',
    run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS posts_time_idx ON posts(created_at DESC);
''')

add("backend/src/main.rs", r'''
use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use dashmap::DashMap;
use futures_util::{SinkExt, StreamExt};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use rand_core::OsRng;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::{env, net::SocketAddr, sync::Arc};
use tokio::sync::broadcast;
use tower_http::{cors::CorsLayer, limit::RequestBodyLimitLayer, trace::TraceLayer};
use tracing::{error, info};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    pool: PgPool,
    jwt_secret: Arc<String>,
    sockets: Arc<DashMap<Uuid, broadcast::Sender<String>>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims { sub: String, sid: String, exp: usize }

#[derive(Deserialize)]
struct Credentials { username: String, password: String, display_name: Option<String> }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateConversation { peer_user_id: Uuid }
#[derive(Deserialize)]
struct CreateGroup { name: String }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateChannel { name: String, is_public: Option<bool>, description: Option<String> }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct NewMessage { body: String, client_id: Option<Uuid> }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct NewRun { distance_meters: f64, duration_seconds: i64, route_points: Vec<[f64; 2]> }

fn api_error(code: StatusCode, message: &str) -> (StatusCode, Json<Value>) {
    (code, Json(json!({"ok": false, "error": message})))
}

fn create_access_token(user_id: Uuid, session_id: Uuid, secret: &str) -> Result<String, String> {
    let claims = Claims {
        sub: user_id.to_string(),
        sid: session_id.to_string(),
        exp: (Utc::now() + Duration::hours(12)).timestamp() as usize,
    };
    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes()))
        .map_err(|e| e.to_string())
}

async fn issue_session(pool: &PgPool, user_id: Uuid, secret: &str) -> Result<String, sqlx::Error> {
    let session_id = Uuid::new_v4();
    let expires = Utc::now() + Duration::hours(12);
    sqlx::query("INSERT INTO sessions (id, user_id, expires_at) VALUES ($1,$2,$3)")
        .bind(session_id).bind(user_id).bind(expires).execute(pool).await?;
    create_access_token(user_id, session_id, secret).map_err(|e| sqlx::Error::Protocol(e))
}

async fn authenticated_user(headers: &HeaderMap, state: &AppState) -> Result<Uuid, (StatusCode, Json<Value>)> {
    let raw = headers.get("authorization").and_then(|v| v.to_str().ok()).unwrap_or("");
    let token = raw.strip_prefix("Bearer ").ok_or_else(|| api_error(StatusCode::UNAUTHORIZED, "Bearer token kerak"))?;
    let data = decode::<Claims>(token, &DecodingKey::from_secret(state.jwt_secret.as_bytes()), &Validation::default())
        .map_err(|_| api_error(StatusCode::UNAUTHORIZED, "Token noto‘g‘ri yoki muddati tugagan"))?;
    let uid = Uuid::parse_str(&data.claims.sub).map_err(|_| api_error(StatusCode::UNAUTHORIZED, "Token subject noto‘g‘ri"))?;
    let sid = Uuid::parse_str(&data.claims.sid).map_err(|_| api_error(StatusCode::UNAUTHORIZED, "Session noto‘g‘ri"))?;
    let active = sqlx::query_scalar::<_, i64>(
        "SELECT 1::BIGINT FROM sessions WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at > NOW()"
    ).bind(sid).bind(uid).fetch_optional(&state.pool).await
        .map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Session tekshiruvida xato"))?;
    if active.is_none() { return Err(api_error(StatusCode::UNAUTHORIZED, "Session bekor qilingan")); }
    Ok(uid)
}

async fn health(State(state): State<AppState>) -> impl IntoResponse {
    match sqlx::query_scalar::<_, i32>("SELECT 1").fetch_one(&state.pool).await {
        Ok(_) => (StatusCode::OK, Json(json!({"ok":true,"service":"yugur-api","database":"ok"}))),
        Err(_) => (StatusCode::SERVICE_UNAVAILABLE, Json(json!({"ok":false,"database":"unavailable"}))),
    }
}

async fn register(State(state): State<AppState>, Json(input): Json<Credentials>) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let username = input.username.trim().to_lowercase();
    let display = input.display_name.unwrap_or_else(|| username.clone()).trim().to_string();
    if username.len() < 3 || username.len() > 24 || !username.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return Err(api_error(StatusCode::BAD_REQUEST, "Username 3-24 ta belgi; faqat a-z, 0-9 va _"));
    }
    if input.password.len() < 12 || input.password.len() > 128 {
        return Err(api_error(StatusCode::BAD_REQUEST, "Parol 12-128 belgi bo‘lishi kerak"));
    }
    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default().hash_password(input.password.as_bytes(), &salt)
        .map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Parolni xeshlash xatosi"))?.to_string();
    let row = sqlx::query("INSERT INTO users (username,display_name,password_hash) VALUES ($1,$2,$3) RETURNING id,username,display_name,avatar_url,bio")
        .bind(&username).bind(if display.is_empty() { username.clone() } else { display })
        .bind(hash).fetch_one(&state.pool).await
        .map_err(|e| if e.to_string().contains("unique") { api_error(StatusCode::CONFLICT, "Username band") } else { api_error(StatusCode::INTERNAL_SERVER_ERROR, "Hisob yaratilmadi") })?;
    let id: Uuid = row.get("id");
    let token = issue_session(&state.pool, id, &state.jwt_secret).await
        .map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Session yaratilmadi"))?;
    Ok(Json(json!({"ok":true,"token":token,"user":{
        "id":id,"username":row.get::<String,_>("username"),"displayName":row.get::<String,_>("display_name"),
        "avatarUrl":row.get::<Option<String>,_>("avatar_url"),"bio":row.get::<String,_>("bio")
    }})))
}

async fn login(State(state): State<AppState>, Json(input): Json<Credentials>) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let username = input.username.trim().to_lowercase();
    let row = sqlx::query("SELECT id,username,display_name,password_hash,avatar_url,bio FROM users WHERE username=$1")
        .bind(&username).fetch_optional(&state.pool).await
        .map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Login so‘rovida xato"))?
        .ok_or_else(|| api_error(StatusCode::UNAUTHORIZED, "Login yoki parol noto‘g‘ri"))?;
    let hash: String = row.get("password_hash");
    let parsed = PasswordHash::new(&hash).map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Parol yozuvi buzilgan"))?;
    Argon2::default().verify_password(input.password.as_bytes(), &parsed)
        .map_err(|_| api_error(StatusCode::UNAUTHORIZED, "Login yoki parol noto‘g‘ri"))?;
    let id: Uuid = row.get("id");
    let token = issue_session(&state.pool, id, &state.jwt_secret).await
        .map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Session yaratilmadi"))?;
    Ok(Json(json!({"ok":true,"token":token,"user":{
        "id":id,"username":row.get::<String,_>("username"),"displayName":row.get::<String,_>("display_name"),
        "avatarUrl":row.get::<Option<String>,_>("avatar_url"),"bio":row.get::<String,_>("bio")
    }})))
}

async fn logout(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let raw = headers.get("authorization").and_then(|v| v.to_str().ok()).unwrap_or("");
    let token = raw.strip_prefix("Bearer ").ok_or_else(|| api_error(StatusCode::UNAUTHORIZED, "Token kerak"))?;
    let data = decode::<Claims>(token, &DecodingKey::from_secret(state.jwt_secret.as_bytes()), &Validation::default())
        .map_err(|_| api_error(StatusCode::UNAUTHORIZED, "Token noto‘g‘ri"))?;
    let sid = Uuid::parse_str(&data.claims.sid).map_err(|_| api_error(StatusCode::UNAUTHORIZED, "Session noto‘g‘ri"))?;
    sqlx::query("UPDATE sessions SET revoked_at=NOW() WHERE id=$1").bind(sid).execute(&state.pool).await
        .map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Logout xatosi"))?;
    Ok(Json(json!({"ok":true})))
}

async fn me(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let uid = authenticated_user(&headers, &state).await?;
    let row = sqlx::query("SELECT id,username,display_name,avatar_url,bio FROM users WHERE id=$1")
        .bind(uid).fetch_one(&state.pool).await.map_err(|_| api_error(StatusCode::NOT_FOUND, "Foydalanuvchi topilmadi"))?;
    Ok(Json(json!({"ok":true,"user":{
        "id":row.get::<Uuid,_>("id"),"username":row.get::<String,_>("username"),
        "displayName":row.get::<String,_>("display_name"),"avatarUrl":row.get::<Option<String>,_>("avatar_url"),"bio":row.get::<String,_>("bio")
    }})))
}

async fn conversations(State(state): State<AppState>, headers: HeaderMap) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let uid = authenticated_user(&headers, &state).await?;
    let rows = sqlx::query("SELECT c.id,c.kind,c.title,c.updated_at FROM conversations c JOIN conversation_members m ON m.conversation_id=c.id WHERE m.user_id=$1 ORDER BY c.updated_at DESC LIMIT 100")
        .bind(uid).fetch_all(&state.pool).await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Chatlar yuklanmadi"))?;
    let items: Vec<Value> = rows.into_iter().map(|r| json!({
        "id":r.get::<Uuid,_>("id"),"kind":r.get::<String,_>("kind"),
        "title":r.get::<Option<String>,_>("title"),"updatedAt":r.get::<chrono::DateTime<Utc>,_>("updated_at")
    })).collect();
    Ok(Json(json!({"ok":true,"conversations":items})))
}

async fn create_conversation(State(state): State<AppState>, headers: HeaderMap, Json(input): Json<CreateConversation>) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let uid = authenticated_user(&headers, &state).await?;
    if uid == input.peer_user_id { return Err(api_error(StatusCode::BAD_REQUEST, "O‘zingiz bilan chat ochib bo‘lmaydi")); }
    let exists = sqlx::query_scalar::<_, i64>("SELECT 1::BIGINT FROM users WHERE id=$1").bind(input.peer_user_id).fetch_optional(&state.pool).await
        .map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "User tekshiruvi xatosi"))?;
    if exists.is_none() { return Err(api_error(StatusCode::NOT_FOUND, "Foydalanuvchi topilmadi")); }
    let mut tx = state.pool.begin().await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Transaction xatosi"))?;
    let cid: Uuid = sqlx::query_scalar("INSERT INTO conversations(kind,owner_id) VALUES('direct',$1) RETURNING id")
        .bind(uid).fetch_one(&mut *tx).await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Chat yaratilmadi"))?;
    for member in [uid, input.peer_user_id] {
        sqlx::query("INSERT INTO conversation_members(conversation_id,user_id,role) VALUES($1,$2,'member')")
            .bind(cid).bind(member).execute(&mut *tx).await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Chat a‘zosi qo‘shilmadi"))?;
    }
    tx.commit().await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Chat saqlanmadi"))?;
    Ok(Json(json!({"ok":true,"id":cid})))
}

async fn create_group(State(state): State<AppState>, headers: HeaderMap, Json(input): Json<CreateGroup>) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let uid = authenticated_user(&headers, &state).await?;
    let name = input.name.trim();
    if name.len() < 2 || name.len() > 80 { return Err(api_error(StatusCode::BAD_REQUEST, "Guruh nomi 2-80 belgi bo‘lsin")); }
    let mut tx = state.pool.begin().await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Transaction xatosi"))?;
    let cid: Uuid = sqlx::query_scalar("INSERT INTO conversations(kind,title,owner_id) VALUES('group',$1,$2) RETURNING id")
        .bind(name).bind(uid).fetch_one(&mut *tx).await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Guruh yaratilmadi"))?;
    sqlx::query("INSERT INTO conversation_members(conversation_id,user_id,role) VALUES($1,$2,'owner')")
        .bind(cid).bind(uid).execute(&mut *tx).await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Guruh egasi qo‘shilmadi"))?;
    tx.commit().await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Guruh saqlanmadi"))?;
    Ok(Json(json!({"ok":true,"id":cid})))
}

async fn create_channel(State(state): State<AppState>, headers: HeaderMap, Json(input): Json<CreateChannel>) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let uid = authenticated_user(&headers, &state).await?;
    let name = input.name.trim();
    if name.len() < 2 || name.len() > 80 { return Err(api_error(StatusCode::BAD_REQUEST, "Kanal nomi 2-80 belgi bo‘lsin")); }
    let row = sqlx::query("INSERT INTO channels(owner_id,name,description,is_public) VALUES($1,$2,$3,$4) RETURNING id")
        .bind(uid).bind(name).bind(input.description.unwrap_or_default()).bind(input.is_public.unwrap_or(true))
        .fetch_one(&state.pool).await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Kanal yaratilmadi"))?;
    let id: Uuid = row.get("id");
    sqlx::query("INSERT INTO channel_members(channel_id,user_id,role) VALUES($1,$2,'owner')").bind(id).bind(uid)
        .execute(&state.pool).await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Kanal egasi qo‘shilmadi"))?;
    Ok(Json(json!({"ok":true,"id":id})))
}

async fn messages(State(state): State<AppState>, Path(cid): Path<Uuid>, headers: HeaderMap) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let uid = authenticated_user(&headers, &state).await?;
    let member = sqlx::query_scalar::<_, i64>("SELECT 1::BIGINT FROM conversation_members WHERE conversation_id=$1 AND user_id=$2")
        .bind(cid).bind(uid).fetch_optional(&state.pool).await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Ruxsat tekshiruvi xatosi"))?;
    if member.is_none() { return Err(api_error(StatusCode::FORBIDDEN, "Bu chatga ruxsatingiz yo‘q")); }
    let rows = sqlx::query("SELECT id,sender_id,body,created_at,client_id FROM messages WHERE conversation_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 100")
        .bind(cid).fetch_all(&state.pool).await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Xabarlar yuklanmadi"))?;
    let mut list: Vec<Value> = rows.into_iter().map(|r| json!({
        "id":r.get::<Uuid,_>("id"),"senderId":r.get::<Uuid,_>("sender_id"),"body":r.get::<String,_>("body"),
        "createdAt":r.get::<chrono::DateTime<Utc>,_>("created_at"),"clientId":r.get::<Uuid,_>("client_id")
    })).collect();
    list.reverse();
    Ok(Json(json!({"ok":true,"messages":list})))
}

async fn send_message(State(state): State<AppState>, Path(cid): Path<Uuid>, headers: HeaderMap, Json(input): Json<NewMessage>) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let uid = authenticated_user(&headers, &state).await?;
    let body = input.body.trim();
    if body.is_empty() || body.len() > 4000 { return Err(api_error(StatusCode::BAD_REQUEST, "Xabar 1-4000 belgi bo‘lsin")); }
    let member = sqlx::query_scalar::<_, i64>("SELECT 1::BIGINT FROM conversation_members WHERE conversation_id=$1 AND user_id=$2")
        .bind(cid).bind(uid).fetch_optional(&state.pool).await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Ruxsat tekshiruvi xatosi"))?;
    if member.is_none() { return Err(api_error(StatusCode::FORBIDDEN, "Bu chatga yozish huquqingiz yo‘q")); }
    let client_id = input.client_id.unwrap_or_else(Uuid::new_v4);
    let row = sqlx::query("INSERT INTO messages(conversation_id,sender_id,client_id,body) VALUES($1,$2,$3,$4) ON CONFLICT(sender_id,client_id) DO UPDATE SET client_id=EXCLUDED.client_id RETURNING id,sender_id,body,created_at,client_id")
        .bind(cid).bind(uid).bind(client_id).bind(body).fetch_one(&state.pool).await
        .map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Xabar saqlanmadi"))?;
    sqlx::query("UPDATE conversations SET updated_at=NOW() WHERE id=$1").bind(cid).execute(&state.pool).await.ok();
    let event = json!({"type":"message","conversationId":cid,"message":{
        "id":row.get::<Uuid,_>("id"),"senderId":row.get::<Uuid,_>("sender_id"),"body":row.get::<String,_>("body"),
        "createdAt":row.get::<chrono::DateTime<Utc>,_>("created_at"),"clientId":row.get::<Uuid,_>("client_id")
    }}).to_string();
    let recipients = sqlx::query("SELECT user_id FROM conversation_members WHERE conversation_id=$1").bind(cid).fetch_all(&state.pool).await.unwrap_or_default();
    for recipient in recipients {
        let user_id: Uuid = recipient.get("user_id");
        if let Some(tx) = state.sockets.get(&user_id) { let _ = tx.send(event.clone()); }
    }
    Ok(Json(json!({"ok":true,"id":row.get::<Uuid,_>("id")})))
}

async fn save_run(State(state): State<AppState>, headers: HeaderMap, Json(input): Json<NewRun>) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let uid = authenticated_user(&headers, &state).await?;
    if !input.distance_meters.is_finite() || input.distance_meters < 0.0 || input.distance_meters > 250_000.0 || input.duration_seconds < 0 || input.duration_seconds > 172800 {
        return Err(api_error(StatusCode::BAD_REQUEST, "Yugurish ko‘rsatkichlari yaroqsiz"));
    }
    if input.route_points.len() > 20000 { return Err(api_error(StatusCode::BAD_REQUEST, "Marshrut nuqtalari limiti oshdi")); }
    for point in &input.route_points {
        if !point[0].is_finite() || !point[1].is_finite() || !(-180.0..=180.0).contains(&point[0]) || !(-90.0..=90.0).contains(&point[1]) {
            return Err(api_error(StatusCode::BAD_REQUEST, "GPS koordinatasi noto‘g‘ri"));
        }
    }
    let route = serde_json::to_value(&input.route_points).unwrap_or(json!([]));
    let max_speed = if input.duration_seconds > 0 { input.distance_meters / input.duration_seconds as f64 } else { 0.0 };
    let flagged = max_speed > 12.5;
    let id: Uuid = sqlx::query_scalar("INSERT INTO runs(user_id,distance_m,duration_seconds,route_points,flagged) VALUES($1,$2,$3,$4,$5) RETURNING id")
        .bind(uid).bind(input.distance_meters).bind(input.duration_seconds).bind(route).bind(flagged)
        .fetch_one(&state.pool).await.map_err(|_| api_error(StatusCode::INTERNAL_SERVER_ERROR, "Yugurish saqlanmadi"))?;
    Ok(Json(json!({"ok":true,"id":id,"reviewRequired":flagged})))
}

async fn websocket_handler(State(state): State<AppState>, headers: HeaderMap, ws: WebSocketUpgrade) -> impl IntoResponse {
    let uid = match authenticated_user(&headers, &state).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };
    ws.on_upgrade(move |socket| websocket_session(socket, uid, state))
}

async fn websocket_session(socket: WebSocket, uid: Uuid, state: AppState) {
    let tx = if let Some(existing) = state.sockets.get(&uid) {
        existing.clone()
    } else {
        let (created, _) = broadcast::channel(256);
        state.sockets.insert(uid, created.clone());
        created
    };
    let mut rx = tx.subscribe();
    let (mut sender, mut receiver) = socket.split();
    loop {
        tokio::select! {
            incoming = receiver.next() => match incoming {
                Some(Ok(Message::Close(_))) | None => break,
                Some(Ok(Message::Ping(data))) => { if sender.send(Message::Pong(data)).await.is_err() { break; } },
                Some(Err(_)) => break,
                _ => {}
            },
            event = rx.recv() => match event {
                Ok(payload) => if sender.send(Message::Text(payload.into())).await.is_err() { break; },
                Err(broadcast::error::RecvError::Lagged(_)) => continue,
                Err(broadcast::error::RecvError::Closed) => break,
            }
        }
    }
    if tx.receiver_count() <= 1 { state.sockets.remove(&uid); }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt().with_env_filter(
        tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "yugur_backend=info,tower_http=info".into())
    ).init();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL env kerak");
    let secret = env::var("JWT_SECRET").expect("JWT_SECRET env kerak");
    if secret.as_bytes().len() < 32 { panic!("JWT_SECRET kamida 32 byte bo‘lishi kerak"); }
    let pool = PgPoolOptions::new().max_connections(20).acquire_timeout(std::time::Duration::from_secs(10))
        .connect(&database_url).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    let state = AppState { pool, jwt_secret: Arc::new(secret), sockets: Arc::new(DashMap::new()) };
    let app = Router::new()
        .route("/health", get(health))
        .route("/v1/auth/register", post(register))
        .route("/v1/auth/login", post(login))
        .route("/v1/auth/logout", post(logout))
        .route("/v1/me", get(me))
        .route("/v1/conversations", get(conversations).post(create_conversation))
        .route("/v1/conversations/{cid}/messages", get(messages).post(send_message))
        .route("/v1/groups", post(create_group))
        .route("/v1/channels", post(create_channel))
        .route("/v1/runs", post(save_run))
        .route("/v1/ws", get(websocket_handler))
        .layer(RequestBodyLimitLayer::new(1024 * 1024))
        .layer(CorsLayer::very_permissive()) // Development only: replace with explicit trusted origins in production.
        .layer(TraceLayer::new_for_http())
        .with_state(state);
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port: u16 = env::var("PORT").unwrap_or_else(|_| "8080".to_string()).parse()?;
    let addr: SocketAddr = format!("{host}:{port}").parse()?;
    info!("YUGUR API listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
''')

add("docs/SECURITY.md", r'''
# Security checklist before public launch

- [ ] Replace permissive CORS with a strict allow-list of your production app/web origins.
- [ ] Put Axum behind HTTPS/WSS reverse proxy; disable direct public access to backend port.
- [ ] Use production JWT secret from a secret manager; rotate it with a migration plan.
- [ ] Add per-IP and per-account login/register/message rate limits.
- [ ] Add account recovery, email/phone verification, device list and session revocation UI.
- [ ] Move Android token storage from bootstrap SharedPreferences to Android Keystore-backed encrypted storage.
- [ ] Add E2EE using a maintained, independently audited protocol; do not invent cryptography.
- [ ] Add signed upload URLs, private object storage, content sniffing and malware scanning.
- [ ] Add channel/group role enforcement and moderation endpoints before inviting users.
- [ ] Add Play Integrity verification on the server if you need device integrity signals.
- [ ] Add audit log, alerting, backups, retention policies, GDPR/local privacy review and deletion/export flows.
- [ ] Run dependency scanning, SAST, DAST and an external penetration test.

The generated sample has Argon2id password hashing, JWT session rows and server-side conversation membership checks, but it is not a complete security audit.
''')

add("docs/GPS.md", r'''
# YUGUR GPS engine

The Android client requests high-accuracy fused fixes every second while a user-started location foreground service is active.

Each accepted point must have usable horizontal accuracy. The sample filter rejects fixes worse than 60 m, non-positive time deltas, jumps over 100 m in one sample and implied speed above 12.5 m/s. It preserves raw accuracy metadata in the run state and does not fabricate points across GPS outages.

This is a conservative starter filter, not a scientific-grade GNSS engine. Benchmark against reference tracks on multiple phones and conditions. Tune per-device only using measured evidence. Do not promise 0 m error.

The current sample keeps route points in memory while the service process remains alive. A public release must persist each point incrementally to Room/SQLite and recover an active workout after process death/reboot; implement that before relying on it for long runs.
''')

add("docs/API.md", r'''
# API overview

Base URL: `https://your-api-domain/`

- `GET /health`
- `POST /v1/auth/register` — `{username,password,displayName}`
- `POST /v1/auth/login` — `{username,password}`
- `POST /v1/auth/logout` — Bearer token
- `GET /v1/me` — Bearer token
- `GET /v1/conversations` — Bearer token
- `POST /v1/conversations` — `{peerUserId}`
- `GET /v1/conversations/{cid}/messages` — Bearer token, member only
- `POST /v1/conversations/{cid}/messages` — `{body,clientId?}`, member only
- `POST /v1/groups` — `{name}`
- `POST /v1/channels` — `{name,isPublic?,description?}`
- `POST /v1/runs` — `{distanceMeters,durationSeconds,routePoints:[[lon,lat],...]}`
- `GET /v1/ws` — authenticated WebSocket; sends message events to connected user sessions

Access tokens expire after 12 hours. Logout revokes the server-side session row.
''')

# -----------------------------------------------------------------------------
# Write generated project, create ZIP, optional builds
# -----------------------------------------------------------------------------
def write_project() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    overwrite = os.environ.get("YUGUR_OVERWRITE", "0") == "1"
    for rel, content in FILES.items():
        dest = ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.exists() and not overwrite:
            old = dest.read_text(encoding="utf-8", errors="ignore") if dest.is_file() else ""
            if old == content:
                continue
            backup = dest.with_suffix(dest.suffix + ".bak")
            if not backup.exists() and dest.is_file():
                shutil.copy2(dest, backup)
        dest.write_text(content, encoding="utf-8")

    # Notebook kernels (Kaggle/Colab/Jupyter) do not define __file__.
    # Resolve a stable generator name without depending on the execution mode.
    generator_path = globals().get("__file__")
    if generator_path:
        generator_name = Path(str(generator_path)).name
    else:
        argv0 = str(sys.argv[0]) if sys.argv else ""
        argv_name = Path(argv0).name if argv0 else ""
        if argv_name.lower().endswith(".py") and argv_name not in {"ipykernel_launcher.py", "colab_kernel_launcher.py"}:
            generator_name = argv_name
        else:
            generator_name = "YUGUR_ONE_CELL.py"

    manifest = {
        "project": "YUGUR",
        "generator": generator_name,
        "files": len(FILES),
        "sha256": {k: hashlib.sha256(v.encode("utf-8")).hexdigest() for k, v in FILES.items()},
    }
    (ROOT / "generator-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def make_zip() -> Path:
    zip_path = ROOT.parent / f"{ROOT.name}_SOURCE.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for file in sorted(ROOT.rglob("*")):
            if file.is_file() and ".bak" not in file.name:
                zf.write(file, file.relative_to(ROOT.parent))
    return zip_path


def optional_builds() -> None:
    if os.environ.get("YUGUR_BUILD_BACKEND", "0") == "1":
        cargo = shutil.which("cargo")
        if not cargo:
            print("[SKIP] cargo topilmadi; Rust build qilinmadi.")
        else:
            print("[BUILD] Rust backend cargo check...")
            result = subprocess.run([cargo, "check"], cwd=ROOT / "backend")
            print("[OK] Backend tekshirildi." if result.returncode == 0 else f"[FAIL] cargo check exit={result.returncode}")
    if os.environ.get("YUGUR_BUILD_ANDROID", "0") == "1":
        gradle = shutil.which("gradle")
        if not gradle:
            print("[SKIP] gradle topilmadi. Android Studio/Gradle 9.6 + Android SDK 37 kerak.")
        else:
            android = ROOT / "android"
            print("[BUILD] Android debug APK...")
            result = subprocess.run([gradle, "assembleDebug"], cwd=android)
            apk = android / "app/build/outputs/apk/debug/app-debug.apk"
            if result.returncode == 0 and apk.exists():
                print(f"[OK] APK: {apk}")
            else:
                print(f"[FAIL] Android build exit={result.returncode}")


def main() -> None:
    print("=" * 72)
    print(" YUGUR — NATIVE ANDROID + RUST BACKEND | ONE PYTHON CELL")
    print("=" * 72)
    print(f"[1/4] {len(FILES)} project files are being generated...")
    write_project()
    print(f"[2/4] Project: {ROOT}")
    archive = make_zip()
    print(f"[3/4] ZIP: {archive}")
    print("[4/4] Optional builds...")
    optional_builds()
    print("\nDONE.")
    print("Next steps:")
    print(f"  1) Open {ROOT} and review README.md")
    print("  2) Configure .env and start PostgreSQL with: docker compose up -d db")
    print(f"  3) Run backend: cd '{ROOT / 'backend'}' && cargo run --release")
    print(f"  4) Open '{ROOT / 'android'}' in Android Studio, set YUGUR_API_BASE, sync and build APK.")
    print("NOTE: Generated source is a working foundation; full E2EE, media storage, push, durable offline GPS and production hardening remain to be implemented and tested.")

if __name__ == "__main__":
    main()