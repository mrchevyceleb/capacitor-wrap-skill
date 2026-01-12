---
name: Capacitor App Wrapper
description: Wrap any web app in Capacitor for iOS/Android app store deployment with RevenueCat subscriptions
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
triggers:
  - capacitor
  - app store
  - play store
  - wrap web app
  - native app
  - ios app
  - android app
  - pwa to native
---

# Capacitor App Wrapper Skill

Wraps any web app (PWA or hosted URL) in Capacitor to create native iOS and Android apps ready for app store submission, with optional RevenueCat subscription integration.

## What This Skill Does

1. **Installs Capacitor** and required plugins
2. **Configures remote URL** loading for your web app
3. **Generates app icons** and splash screens from your existing assets
4. **Sets up RevenueCat** for in-app subscriptions (optional)
5. **Configures native platforms** (Android/iOS) with proper styling
6. **Creates Codemagic config** for iOS cloud builds
7. **Generates store listing** text ready to copy-paste
8. **Provides build commands** for both Windows and macOS

## Prerequisites

Before running this skill, ensure you have:
- Node.js 18+ installed
- An existing web app (either hosted URL or local PWA)
- App icons (at least 512x512 PNG)

For building:
- **Android**: JDK 17+ and Android Studio
- **iOS**: macOS with Xcode 15+ OR Codemagic account

## Invocation

This skill is invoked when you ask Claude to:
- "Wrap my web app in Capacitor"
- "Create a native app from my website"
- "Prepare my app for the app stores"
- "Convert my PWA to iOS/Android"

## Workflow

### Phase 1: Gather Information

Ask the user for:

1. **App URL**: The web app URL to wrap (e.g., `https://myapp.com`)
2. **App Name**: Display name (e.g., "My App")
3. **Bundle ID**: Unique identifier (e.g., `com.company.myapp`)
4. **Theme Colors**: Primary and accent colors (hex values)
5. **RevenueCat**: Whether to integrate subscriptions

### Phase 2: Install Dependencies

```bash
# Core Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/app
npm install -D @capacitor/assets

# RevenueCat (if requested)
npm install @revenuecat/purchases-capacitor
```

### Phase 3: Create Configuration

Create `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "{{BUNDLE_ID}}",
  appName: "{{APP_NAME}}",
  webDir: "out",
  server: {
    url: "{{APP_URL}}",
    allowNavigation: ["{{DOMAIN}}", "*.{{DOMAIN}}"],
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "{{PRIMARY_COLOR}}",
  },
  android: {
    backgroundColor: "{{PRIMARY_COLOR}}",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "{{PRIMARY_COLOR}}",
      showSpinner: true,
      spinnerColor: "{{ACCENT_COLOR}}",
    },
  },
};

export default config;
```

### Phase 4: Add Native Platforms

```bash
# Create placeholder out directory
mkdir -p out
echo '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url={{APP_URL}}"></head><body></body></html>' > out/index.html

# Add platforms
npx cap add android
npx cap add ios

# Sync
npx cap sync
```

### Phase 5: Generate Icons

If source icons exist, create icon generation script:

```javascript
// scripts/generate-app-icons.mjs
import sharp from 'sharp';

// Generate 1024x1024 icon with solid background
// Generate 2732x2732 splash screen
// See full implementation in skill
```

Then generate all sizes:
```bash
node scripts/generate-app-icons.mjs
npx capacitor-assets generate --android --ios
```

### Phase 6: Configure Android

Update `android/app/src/main/res/values/colors.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">{{PRIMARY_COLOR}}</color>
    <color name="colorPrimaryDark">{{PRIMARY_COLOR}}</color>
    <color name="colorAccent">{{ACCENT_COLOR}}</color>
</resources>
```

Update `AndroidManifest.xml` with:
- Deep links for app URL
- Billing permission (if RevenueCat)
- HTTPS-only traffic

### Phase 6.5: Generate Release Keystore & Signing Config

**CRITICAL**: Google Play requires signed AABs. This phase sets up release signing.

#### 1. Generate a release keystore:
```bash
keytool -genkey -v -keystore android/{{APP_NAME_LOWER}}-release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias {{APP_NAME_LOWER}}
```

When prompted, enter:
- Keystore password (strong, memorable)
- Key password (can be same as keystore)
- Your name, organization, location info

#### 2. Update `android/app/build.gradle` with signing config:

Add inside the `android { }` block:
```groovy
signingConfigs {
    release {
        if (System.getenv("{{APP_NAME_UPPER}}_KEYSTORE_PATH")) {
            storeFile file(System.getenv("{{APP_NAME_UPPER}}_KEYSTORE_PATH"))
            storePassword System.getenv("{{APP_NAME_UPPER}}_KEYSTORE_PASSWORD")
            keyAlias System.getenv("{{APP_NAME_UPPER}}_KEY_ALIAS")
            keyPassword System.getenv("{{APP_NAME_UPPER}}_KEY_PASSWORD")
        }
    }
}
```

Update the `buildTypes { release { } }` block to use signing:
```groovy
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        if (System.getenv("{{APP_NAME_UPPER}}_KEYSTORE_PATH")) {
            signingConfig signingConfigs.release
        }
    }
}
```

#### 3. Create `docs/SECRET_INFO.md` to store credentials:
```markdown
# {{APP_NAME}} Secret Info - KEEP THIS SAFE!

**DO NOT share this file or commit it to GitHub!**

## Keystore (Android Signing)

| Setting | Value |
|---------|-------|
| File location | `android/{{APP_NAME_LOWER}}-release.keystore` |
| Password | `YOUR_PASSWORD_HERE` |
| Key alias | `{{APP_NAME_LOWER}}` |
| Key password | `YOUR_PASSWORD_HERE` |

## What to Backup

1. `android/{{APP_NAME_LOWER}}-release.keystore` - The keystore file
2. This file (`SECRET_INFO.md`) - Your passwords

**WARNING**: If you lose the keystore, you can NEVER update your app on Google Play!
```

#### 4. Add keystore to `.gitignore`:
```
# Keystore
*.keystore
*.jks
docs/SECRET_INFO.md
```

### Phase 7: RevenueCat Integration (Optional)

Create `lib/services/revenuecat.ts`:
- Initialize with user ID
- Get offerings
- Purchase packages
- Check entitlements
- Handle webhooks

Create webhook endpoint:
- `app/api/webhooks/revenuecat/route.ts`

### Phase 8: Create Build Configurations

Create `codemagic.yaml` for CI/CD:
- iOS App Store workflow
- iOS TestFlight workflow
- Android Play Store workflow
- Android debug workflow

### Phase 9: Generate Documentation

Create comprehensive guide including:
- Build commands for Windows/macOS
- Keystore generation instructions
- Store listing text (copy-paste ready)
- Screenshot requirements
- Deep link setup

## Output Files

| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Main Capacitor configuration |
| `public/error.html` | Offline fallback page |
| `assets/*.png` | Source icons for generation |
| `lib/services/revenuecat.ts` | RevenueCat integration |
| `app/api/webhooks/revenuecat/route.ts` | Webhook handler |
| `codemagic.yaml` | iOS/Android CI/CD config |
| `docs/APP_STORE_GUIDE.md` | Store submission guide |
| `docs/SECRET_INFO.md` | Keystore passwords (DO NOT COMMIT) |
| `scripts/generate-app-icons.mjs` | Icon generation script |
| `android/*-release.keystore` | Release signing key (DO NOT COMMIT) |

## Build Commands

### Android Debug (unsigned)
```bash
cd android
./gradlew assembleDebug    # Debug APK (Windows: .\gradlew.bat)
```

### Android Release (signed - for Google Play)

**Windows PowerShell:**
```powershell
$env:{{APP_NAME_UPPER}}_KEYSTORE_PATH = "C:\path\to\{{APP_NAME_LOWER}}-release.keystore"
$env:{{APP_NAME_UPPER}}_KEYSTORE_PASSWORD = "YOUR_PASSWORD"
$env:{{APP_NAME_UPPER}}_KEY_ALIAS = "{{APP_NAME_LOWER}}"
$env:{{APP_NAME_UPPER}}_KEY_PASSWORD = "YOUR_PASSWORD"
cd android
.\gradlew.bat bundleRelease
```

**macOS/Linux:**
```bash
export {{APP_NAME_UPPER}}_KEYSTORE_PATH="/path/to/{{APP_NAME_LOWER}}-release.keystore"
export {{APP_NAME_UPPER}}_KEYSTORE_PASSWORD="YOUR_PASSWORD"
export {{APP_NAME_UPPER}}_KEY_ALIAS="{{APP_NAME_LOWER}}"
export {{APP_NAME_UPPER}}_KEY_PASSWORD="YOUR_PASSWORD"
cd android
./gradlew bundleRelease
```

**One-liner (bash/Git Bash on Windows):**
```bash
cd android && {{APP_NAME_UPPER}}_KEYSTORE_PATH="/path/to/keystore" {{APP_NAME_UPPER}}_KEYSTORE_PASSWORD="pass" {{APP_NAME_UPPER}}_KEY_ALIAS="alias" {{APP_NAME_UPPER}}_KEY_PASSWORD="pass" ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS (macOS)
```bash
npx cap open ios
# Build in Xcode
```

### iOS (Codemagic)
Push to main branch - builds automatically.

## Example Usage

User: "I want to wrap my fitness app at https://fitapp.com for the app stores"

Assistant will:
1. Ask for app name, bundle ID, colors, RevenueCat preference
2. Install all Capacitor dependencies
3. Create configuration for https://fitapp.com
4. Generate icons from existing assets
5. Configure Android with dark theme
6. Set up Codemagic for iOS builds
7. Create store listing guide with copy-paste text
8. Provide build commands for the user's platform

## Notes

- Always verify the web app URL is accessible
- Check for existing PWA manifest to reuse metadata
- Look for existing icons in common locations (/public, /assets)
- Warn about keystore security (never commit to git)
- Recommend App Signing by Google Play
- For iOS, recommend Codemagic if not on macOS
