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

**Last Updated:** January 2026 (Capacitor 8)

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

### Development Environment (CRITICAL - Updated for 2025/2026)

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | **22+** | Capacitor 8 requires Node 22 (NOT 18) |
| **Java JDK** | **21** | Android builds require Java 21 (NOT 17) |
| **Android Studio** | Latest | For Android SDK and emulator |
| **Xcode** | Latest | For iOS builds (macOS only) |

### Verify Your Environment

```bash
# Check Node version (must be 22+)
node --version

# Check Java version (must be 21)
java --version

# If Java is wrong, install via:
# macOS: brew install openjdk@21
# Windows: Download from adoptium.net
```

### Other Requirements
- An existing web app (either hosted URL or local PWA)
- App icons (at least 512x512 PNG)
- For iOS cloud builds: Codemagic account OR macOS with latest Xcode

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
# Core Capacitor (v8)
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/app
npm install -D @capacitor/assets

# RevenueCat (if requested) - IMPORTANT: Only use purchases-capacitor, NOT purchases-capacitor-ui
npm install @revenuecat/purchases-capacitor
# DO NOT install @revenuecat/purchases-capacitor-ui - it's NOT compatible with Capacitor 8!
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

**IMPORTANT: Fix gradle permissions first (required on macOS/Linux):**
```bash
chmod +x android/gradlew
```

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

**CRITICAL for Capacitor 8:** Only use `@revenuecat/purchases-capacitor`. The UI package (`@revenuecat/purchases-capacitor-ui`) depends on Capacitor 7 and is NOT compatible!

Create `lib/services/revenuecat.ts`:

```typescript
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// Platform-specific API keys
const REVENUECAT_IOS_KEY = import.meta.env.VITE_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY;

export async function initializeRevenueCat(userId?: string) {
  const platform = Capacitor.getPlatform();
  
  // Skip on web
  if (platform === 'web') {
    console.log('RevenueCat not available on web');
    return;
  }
  
  // Use correct API key for platform
  const apiKey = platform === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  
  if (!apiKey) {
    console.error(`No RevenueCat API key for platform: ${platform}`);
    return;
  }
  
  await Purchases.configure({
    apiKey,
    appUserID: userId,
  });
  
  if (import.meta.env.DEV) {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  }
}

// ... rest of RevenueCat service methods
```

**Environment Variables Required:**
- `VITE_REVENUECAT_IOS_API_KEY` - Your iOS public API key from RevenueCat
- `VITE_REVENUECAT_ANDROID_API_KEY` - Your Android public API key from RevenueCat

### Phase 8: iOS Configuration (CRITICAL - Capacitor 8 Changes)

**IMPORTANT:** Capacitor 8 uses **Swift Package Manager (SPM)** instead of CocoaPods!

#### Key Differences from Capacitor 7:
- **NO CocoaPods** - Don't run `pod install`
- **Use `.xcodeproj`** - NOT `.xcworkspace`
- **Must resolve SPM dependencies** before building

#### Manual Build (macOS):
```bash
# Navigate to iOS project
cd ios/App

# Resolve Swift Package Manager dependencies FIRST
xcodebuild -resolvePackageDependencies -project App.xcodeproj -scheme App

# Open in Xcode (use .xcodeproj, NOT .xcworkspace!)
open App.xcodeproj
```

#### Codemagic Build Script:
```yaml
ios-app:
  name: iOS App Store
  instance_type: mac_mini_m2
  max_build_duration: 60
  integrations:
    app_store_connect: "Your Integration Name"  # Must match exactly!
  environment:
    ios_signing:
      distribution_type: app_store
      bundle_identifier: "{{BUNDLE_ID}}"
    vars:
      BUNDLE_ID: "{{BUNDLE_ID}}"
      XCODE_SCHEME: "App"
      XCODE_PROJECT: "ios/App/App.xcodeproj"  # Use .xcodeproj NOT .xcworkspace!
    node: 22  # Capacitor 8 requires Node 22
  scripts:
    - name: Install dependencies
      script: npm ci
    
    - name: Build web app
      script: npm run build
    
    - name: Sync Capacitor
      script: npx cap sync ios
    
    - name: Resolve Swift Package Dependencies
      script: |
        cd ios/App
        xcodebuild -resolvePackageDependencies -project App.xcodeproj -scheme App
    
    - name: Set up code signing
      script: |
        # Fetch signing files from App Store Connect
        app-store-connect fetch-signing-files "$BUNDLE_ID" \
          --type IOS_APP_STORE \
          --create
        
        # Initialize keychain
        keychain initialize
        
        # Add certificates to keychain
        keychain add-certificates
        
        # Configure Xcode project to use profiles
        xcode-project use-profiles --project "$XCODE_PROJECT"
    
    - name: Build iOS app
      script: |
        cd ios/App
        xcodebuild \
          -project App.xcodeproj \
          -scheme "$XCODE_SCHEME" \
          -configuration Release \
          -archivePath build/App.xcarchive \
          archive \
          CODE_SIGN_STYLE=Manual
    
    - name: Export IPA
      script: |
        xcode-project export-ipa \
          --project "$XCODE_PROJECT" \
          --archive build/App.xcarchive
  
  artifacts:
    - ios/App/build/**/*.ipa
    - ios/App/build/**/*.xcarchive
  
  publishing:
    app_store_connect:
      auth: integration
      submit_to_testflight: true
```

### Phase 9: Create Build Configurations

Create `codemagic.yaml` for CI/CD:
- iOS App Store workflow (see Phase 8)
- iOS TestFlight workflow
- Android Play Store workflow
- Android debug workflow

### Phase 10: Generate Documentation

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
chmod +x ./gradlew  # Required on macOS/Linux!
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
chmod +x ./gradlew  # Don't forget this!
./gradlew bundleRelease
```

**One-liner (bash/Git Bash on Windows):**
```bash
cd android && chmod +x ./gradlew && {{APP_NAME_UPPER}}_KEYSTORE_PATH="/path/to/keystore" {{APP_NAME_UPPER}}_KEYSTORE_PASSWORD="pass" {{APP_NAME_UPPER}}_KEY_ALIAS="alias" {{APP_NAME_UPPER}}_KEY_PASSWORD="pass" ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS (macOS with Xcode)
```bash
cd ios/App
# Resolve SPM dependencies first!
xcodebuild -resolvePackageDependencies -project App.xcodeproj -scheme App
# Then open in Xcode
open App.xcodeproj  # Use .xcodeproj, NOT .xcworkspace!
```

### iOS (Codemagic)
Push to main branch - builds automatically.

## Pre-Deployment Checklist

Before submitting to app stores, complete these steps:

### Apple App Store

1. **Register Bundle ID in Apple Developer Portal**
   - Go to Certificates, Identifiers & Profiles > Identifiers
   - Click + to add a new identifier
   - Select App IDs, then App
   - Enter description and Bundle ID (e.g., `ai.carouselcards.app`)
   - Enable any required capabilities (Push Notifications, etc.)

2. **Create App in App Store Connect**
   - Go to Apps > + (New App)
   - Select iOS platform
   - Enter app name, bundle ID, and SKU
   - Set primary language

3. **Set Up App Store Connect API Integration in Codemagic**
   - In App Store Connect: Users and Access > Integrations > App Store Connect API
   - Create a new key with **Admin** access (required for creating certificates/profiles)
   - Download the .p8 file and note the Key ID and Issuer ID
   - In Codemagic: Teams > Integrations > App Store Connect
   - Add the key details (the integration name must match `codemagic.yaml`)

4. **Accept All Agreements**
   - Go to App Store Connect > Business section
   - Accept any pending agreements (Paid Apps, etc.)

5. **RevenueCat Setup (if using)**
   - Create app in RevenueCat dashboard
   - Add iOS app with bundle ID
   - Get public API key for iOS
   - Set up products in App Store Connect first
   - Import products into RevenueCat

### Google Play Store

1. **Create App in Google Play Console**
   - Go to All apps > Create app
   - Fill in app details

2. **Set Up Signing**
   - Generate keystore (see Phase 6.5)
   - Consider enrolling in Google Play App Signing

3. **RevenueCat Setup (if using)**
   - Add Android app in RevenueCat with package name
   - Get public API key for Android
   - Link Google Play service account for server notifications

### Environment Variables

Add these to your CI/CD (Codemagic) and local `.env`:

```bash
# RevenueCat (if using)
VITE_REVENUECAT_IOS_API_KEY=your_ios_public_key
VITE_REVENUECAT_ANDROID_API_KEY=your_android_public_key

# Android Signing (for local builds)
{{APP_NAME_UPPER}}_KEYSTORE_PATH=/path/to/keystore
{{APP_NAME_UPPER}}_KEYSTORE_PASSWORD=your_password
{{APP_NAME_UPPER}}_KEY_ALIAS=your_alias
{{APP_NAME_UPPER}}_KEY_PASSWORD=your_key_password
```

## Troubleshooting

### Common Issues

#### iOS: "No such module" or SPM dependency errors
```bash
# Resolve Swift Package Manager dependencies
cd ios/App
xcodebuild -resolvePackageDependencies -project App.xcodeproj -scheme App
```

#### iOS: "Code signing" errors in Codemagic
- Verify App Store Connect API key has **Admin** access (not just Developer)
- Ensure bundle ID is registered in Apple Developer Portal
- Check that integration name in codemagic.yaml matches exactly
- Accept any pending agreements in App Store Connect

#### iOS: Using wrong Xcode project
```bash
# WRONG - Don't use .xcworkspace with Capacitor 8
open App.xcworkspace

# CORRECT - Use .xcodeproj
open App.xcodeproj
```

#### Android: "Permission denied" on gradlew
```bash
chmod +x android/gradlew
```

#### Android: Unsigned APK/AAB rejected
- Ensure signing config is set up in build.gradle
- Set environment variables before building
- Check that keystore file exists and path is correct

#### RevenueCat: "Cannot find module" errors
```bash
# WRONG - This package is NOT compatible with Capacitor 8
npm install @revenuecat/purchases-capacitor-ui

# CORRECT - Only use the base package
npm install @revenuecat/purchases-capacitor
```

#### Node version errors
```bash
# Capacitor 8 requires Node 22+
node --version  # Should be v22.x.x

# Install Node 22 via nvm
nvm install 22
nvm use 22
```

#### Java version errors
```bash
# Capacitor 8 requires Java 21
java --version  # Should be 21.x.x

# Install Java 21
# macOS: brew install openjdk@21
# Windows: Download from https://adoptium.net/
```

### Codemagic-Specific Issues

#### Build fails with "integration not found"
- The `integrations.app_store_connect` value must exactly match your integration name in Codemagic
- Check Teams > Integrations > App Store Connect for the exact name

#### Build fails on code signing
Add explicit code signing commands:
```yaml
- name: Set up code signing
  script: |
    app-store-connect fetch-signing-files "$BUNDLE_ID" --type IOS_APP_STORE --create
    keychain initialize
    keychain add-certificates
    xcode-project use-profiles --project "$XCODE_PROJECT"
```

## Example Usage

User: "I want to wrap my fitness app at https://fitapp.com for the app stores"

Assistant will:
1. Ask for app name, bundle ID, colors, RevenueCat preference
2. Install all Capacitor dependencies
3. Create configuration for https://fitapp.com
4. Generate icons from existing assets
5. Configure Android with dark theme
6. Set up Codemagic for iOS builds (using SPM, not CocoaPods)
7. Create store listing guide with copy-paste text
8. Provide build commands for the user's platform

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Jan 2026 | Capacitor 8 support, SPM instead of CocoaPods, Node 22 requirement, Java 21 requirement, RevenueCat compatibility fixes |
| 1.0 | 2024 | Initial release for Capacitor 7 |

## Notes

- Always verify the web app URL is accessible
- Check for existing PWA manifest to reuse metadata
- Look for existing icons in common locations (/public, /assets)
- Warn about keystore security (never commit to git)
- Recommend App Signing by Google Play
- For iOS, recommend Codemagic if not on macOS
- **Capacitor 8 uses SPM, not CocoaPods** - use `.xcodeproj`, not `.xcworkspace`
- **Only use `@revenuecat/purchases-capacitor`** - the UI package is not Capacitor 8 compatible
