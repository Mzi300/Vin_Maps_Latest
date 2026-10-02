# Vin_Maps2
Geographical Map

## Android app (Capacitor)

The desktop web build in the repo-root `dist/` is the single source of truth for the
Android app. Gradle packages `vinmaps-backend/frontend/android/app/src/main/assets/public`,
so that folder must always be an exact copy of `dist/`.

```bash
npm run cap:sync    # build the web bundle, copy it into the Android project, verify byte-for-byte
npm run cap:apk     # build the debug APK (auto-detects a Java 21 toolchain)
npm run cap:open    # open the project in Android Studio
```

Notes:
- `npm run cap:apk` requires a JDK 21+ (Capacitor Android 8 compiles with `--release 21`).
  Set `VINMAPS_JAVA_HOME` or `JAVA_HOME`, otherwise Android Studio's bundled JBR is used automatically.
- `npm run cap:verify` (also run by `cap:sync`) fails if the Android web assets are stale
  or differ from `dist/`.
- The APK is written to
  `vinmaps-backend/frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

