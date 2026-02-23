# Native Build Guide — Balancen

## 1. iOS Permissions (Info.plist)

In your Capacitor iOS project (`ios/App/App/Info.plist`), add these keys:

```xml
<key>NSCameraUsageDescription</key>
<string>Used to scan and log meals</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Used to select meal photos</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Used to save meal photos</string>
```

These are required by App Store review. Without them, the app will crash when accessing camera/photos on iOS.

---

## 2. Android Permissions (AndroidManifest.xml)

In `android/app/src/main/AndroidManifest.xml`, inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<!-- For Android 12 and below -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32"/>
```

Permissions are already requested only at first use (not on launch) — the in-app `CameraPermissionPrompt` component handles this flow before any native permission dialog appears.

---

## 3. Offline / Network Error States (Done in-app)

- `OfflineBanner` component: shown globally when `navigator.onLine` is false
- `AIErrorFallback` component: drop-in UI for AI/network failures with retry button
  - Usage: `<AIErrorFallback onRetry={yourFetchFn} lang="en" />`

---

## 4. Release Build Steps

### iOS (App Store)

```bash
# 1. Build the web assets
npm run build

# 2. Sync to Capacitor
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# In Xcode:
# - Select "Any iOS Device (arm64)" as destination
# - Product → Archive
# - In Organizer → Distribute App → App Store Connect
# - Sign with your Distribution certificate + provisioning profile
```

### Android (Google Play AAB)

```bash
# 1. Build the web assets
npm run build

# 2. Sync to Capacitor
npx cap sync android

# 3. Open Android Studio
npx cap open android

# In Android Studio:
# - Build → Generate Signed Bundle / APK
# - Choose "Android App Bundle"
# - Use your upload keystore
# - Select "release" build variant
# - Upload the .aab to Google Play Console → Production
```

### Required before building:
- Apple Developer account + Distribution certificate + App Store provisioning profile
- Google Play keystore (`upload-keystore.jks`) — keep this safe, it cannot be regenerated
- `capacitor.config.ts` with correct `appId` (e.g. `app.balancen.app`) and `appName: "Balancen"