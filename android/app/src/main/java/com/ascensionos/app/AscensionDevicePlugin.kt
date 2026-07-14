package com.ascensionos.app

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.contracts.HealthPermissionsRequestContract
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@CapacitorPlugin(name = "AscensionDevice")
class AscensionDevicePlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val providerPackage = "com.google.android.apps.healthdata"
    private val healthPermissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class)
    )

    @PluginMethod
    fun getIntegrationStatus(call: PluginCall) {
        scope.launch {
            val status = statusObject()
            withContext(Dispatchers.Main) { call.resolve(status) }
        }
    }

    @PluginMethod
    fun requestHealthPermissions(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context, providerPackage)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect is unavailable or needs an update.", "HEALTH_CONNECT_UNAVAILABLE")
            return
        }
        val intent = HealthPermissionsRequestContract(providerPackage).createIntent(context, healthPermissions)
        startActivityForResult(call, intent, "healthPermissionResult")
    }

    @ActivityCallback
    fun healthPermissionResult(call: PluginCall?, result: ActivityResult?) {
        if (call == null) return
        scope.launch {
            val status = statusObject()
            withContext(Dispatchers.Main) { call.resolve(status) }
        }
    }

    @PluginMethod
    fun openUsageAccessSettings(call: PluginCall) {
        context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        call.resolve()
    }

    @PluginMethod
    fun readDailyMetrics(call: PluginCall) {
        val date = runCatching { LocalDate.parse(call.getString("date")) }.getOrElse { LocalDate.now() }
        scope.launch {
            val result = readSnapshots(date)
            withContext(Dispatchers.Main) {
                call.resolve(result)
            }
        }
    }

    private suspend fun readSnapshots(date: LocalDate): JSObject {
        val response = JSObject()
        val snapshots = JSArray()
        val warnings = JSArray()
        val healthStatus = HealthConnectClient.getSdkStatus(context, providerPackage)

        if (healthStatus == HealthConnectClient.SDK_AVAILABLE && hasHealthPermissions()) {
            runCatching { readHealthSnapshot(date) }
                .onSuccess { snapshots.put(it) }
                .onFailure { warnings.put("Health Connect read failed: ${it.message ?: "unknown error"}") }
        } else {
            warnings.put("Health Connect permissions are not ready.")
        }

        if (hasUsageAccess()) {
            runCatching { readUsageSnapshot(date) }
                .onSuccess { snapshots.put(it) }
                .onFailure { warnings.put("Screen-time read failed: ${it.message ?: "unknown error"}") }
        } else {
            warnings.put("Android Usage Access is not enabled.")
        }

        response.put("snapshots", snapshots)
        response.put("warnings", warnings)
        response.put("status", statusObject())
        return response
    }

    private suspend fun readHealthSnapshot(date: LocalDate): JSObject {
        val client = HealthConnectClient.getOrCreate(context)
        val zone = ZoneId.systemDefault()
        val dayStart = date.atStartOfDay(zone).toInstant()
        val dayEnd = date.plusDays(1).atStartOfDay(zone).toInstant()
        val sleepStart = date.minusDays(1).atTime(18, 0).atZone(zone).toInstant()
        val sleepEnd = date.plusDays(1).atTime(12, 0).atZone(zone).toInstant()

        val dayAggregate = client.aggregate(
            AggregateRequest(
                metrics = setOf(
                    StepsRecord.COUNT_TOTAL,
                    ExerciseSessionRecord.EXERCISE_DURATION_TOTAL
                ),
                timeRangeFilter = TimeRangeFilter.between(dayStart, dayEnd)
            )
        )
        val sleepAggregate = client.aggregate(
            AggregateRequest(
                metrics = setOf(SleepSessionRecord.SLEEP_DURATION_TOTAL),
                timeRangeFilter = TimeRangeFilter.between(sleepStart, sleepEnd)
            )
        )
        val weights = client.readRecords(
            ReadRecordsRequest(
                recordType = WeightRecord::class,
                timeRangeFilter = TimeRangeFilter.between(dayStart, dayEnd)
            )
        ).records
        val latestWeight = weights.maxByOrNull { it.time }?.weight?.inKilograms
        val steps = (dayAggregate[StepsRecord.COUNT_TOTAL] as? Long) ?: 0L
        val exerciseMillis = (dayAggregate[ExerciseSessionRecord.EXERCISE_DURATION_TOTAL] as? Long) ?: 0L
        val sleepMillis = (sleepAggregate[SleepSessionRecord.SLEEP_DURATION_TOTAL] as? Long) ?: 0L

        val metrics = JSObject()
        metrics.put("steps", steps)
        metrics.put("exercise_minutes", exerciseMillis / 60_000.0)
        metrics.put("sleep_hours", sleepMillis / 3_600_000.0)
        if (latestWeight != null) metrics.put("weight_kg", latestWeight)
        return snapshot("health_connect", date, metrics, healthPermission = true, usagePermission = hasUsageAccess())
    }

    private suspend fun readUsageSnapshot(date: LocalDate): JSObject {
        val zone = ZoneId.systemDefault()
        val start = date.atStartOfDay(zone).toInstant().toEpochMilli()
        val end = date.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
        val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val stats = manager.queryAndAggregateUsageStats(start, end)
        var totalMinutes = 0L
        var reelsMinutes = 0L
        var youtubeMinutes = 0L
        var socialMinutes = 0L

        stats.forEach { (packageName, usage) ->
            val minutes = usage.totalTimeInForeground / 60_000L
            totalMinutes += minutes
            when {
                packageName == "com.google.android.youtube" -> youtubeMinutes += minutes
                packageName in setOf("com.instagram.android", "com.zhiliaoapp.musically") -> reelsMinutes += minutes
                packageName in setOf("com.facebook.katana", "com.snapchat.android", "com.reddit.frontpage", "com.twitter.android") -> socialMinutes += minutes
            }
        }

        val metrics = JSObject()
        metrics.put("total_screen_minutes", totalMinutes)
        metrics.put("reels_minutes", reelsMinutes)
        metrics.put("youtube_minutes", youtubeMinutes)
        metrics.put("social_minutes", socialMinutes)
        return snapshot("android_usage_stats", date, metrics, healthPermission = hasHealthPermissions(), usagePermission = true)
    }

    private fun snapshot(source: String, date: LocalDate, metrics: JSObject, healthPermission: Boolean, usagePermission: Boolean): JSObject {
        return JSObject()
            .put("device_id", deviceId())
            .put("source", source)
            .put("metric_date", date.toString())
            .put("metrics_json", metrics)
            .put("permission_snapshot", JSObject().put("health_connect", healthPermission).put("usage_stats", usagePermission))
            .put("captured_at", Instant.now().toString())
    }

    private suspend fun statusObject(): JSObject {
        val healthStatus = HealthConnectClient.getSdkStatus(context, providerPackage)
        return JSObject()
            .put("runtime", "android")
            .put(
                "health_connect",
                when {
                    healthStatus != HealthConnectClient.SDK_AVAILABLE -> "unavailable"
                    hasHealthPermissions() -> "connected"
                    else -> "permission_required"
                }
            )
            .put("usage_stats", if (hasUsageAccess()) "connected" else "permission_required")
    }

    private suspend fun hasHealthPermissions(): Boolean {
        if (HealthConnectClient.getSdkStatus(context, providerPackage) != HealthConnectClient.SDK_AVAILABLE) return false
        return runCatching {
            val client = HealthConnectClient.getOrCreate(context)
            client.permissionController.getGrantedPermissions().containsAll(healthPermissions)
        }.getOrDefault(false)
    }

    private fun hasUsageAccess(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        return appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName) == AppOpsManager.MODE_ALLOWED
    }

    private fun deviceId(): String = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "android-device"

    override fun handleOnDestroy() {
        scope.cancel()
        super.handleOnDestroy()
    }
}
