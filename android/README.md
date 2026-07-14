# AscensionOS Android bridge

The Android project is a Capacitor shell around the deployed Next.js app. The native plugin reads daily aggregate data from Android Health Connect and Android Usage Access, then exposes it to the web app through `AscensionDevice`.

## Build a usable APK

The APK needs a reachable web URL. Without `CAPACITOR_SERVER_URL`, it opens the small native fallback page instead of the full Next.js app.

From the repository root in PowerShell:

```powershell
$env:CAPACITOR_SERVER_URL = "https://your-ascensionos-domain.vercel.app"
npx.cmd cap sync android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
Push-Location android
.\gradlew.bat assembleDebug --no-daemon
Pop-Location
```

The debug APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`.

For local Wi-Fi testing, use the laptop's LAN address instead of `localhost`, for example `http://192.168.1.20:3001`, and start Next.js with a host reachable from the phone. Cleartext HTTP is enabled only when the configured URL starts with `http://`.

Install with Android platform tools:

```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## First phone setup

1. Install or update Samsung Health and Android Health Connect on the S23.
2. Open AscensionOS Settings > Phone telemetry.
3. Grant read access for steps, sleep, exercise, and weight.
4. Enable Usage Access for AscensionOS in Android system settings.
5. Press `Sync now`, then review the imported values in Check-in.

Imported telemetry is stored as daily snapshots. It fills blank check-in fields only; a value entered manually always wins. Removing snapshots from AscensionOS does not remove data from Samsung Health or Android system history.

## Important boundaries

- The browser and ordinary PWA cannot read private Samsung Health or Android app-usage data.
- Health Connect is the primary Samsung Health bridge for this private app.
- The direct Samsung Health Data SDK is intentionally deferred because it requires a separate partnership and SDK access path.
- `GEMINI_API_KEY` remains server-side and is unrelated to this native bridge.
