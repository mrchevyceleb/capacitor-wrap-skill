# Capacitor Wrap Skill for Claude Code

A Claude Code skill that wraps any web app in Capacitor for iOS and Android app store deployment, with optional RevenueCat subscription integration.

## Features

- **One-command setup**: Installs and configures Capacitor for any web app
- **Icon generation**: Creates all required app store icon sizes from a single source
- **RevenueCat integration**: Optional in-app subscription support
- **Cross-platform builds**: Works on Windows and macOS
- **Cloud CI/CD**: Codemagic configuration for iOS builds without a Mac
- **Store-ready**: Generates copy-paste store listing text

## Installation

### Option 1: Copy to your skills directory

```bash
# Clone this repo
git clone https://github.com/YOUR_USERNAME/capacitor-wrap-skill.git

# Copy to Claude Code skills directory
# Windows
copy capacitor-wrap-skill\SKILL.md %USERPROFILE%\.claude\skills\capacitor-wrap\

# macOS/Linux
cp capacitor-wrap-skill/SKILL.md ~/.claude/skills/capacitor-wrap/
```

### Option 2: Manual installation

1. Create the skill directory:
   ```bash
   mkdir -p ~/.claude/skills/capacitor-wrap
   ```

2. Copy `SKILL.md` to `~/.claude/skills/capacitor-wrap/SKILL.md`

## Usage

In Claude Code, simply describe what you want:

```
"Wrap my web app at https://myapp.com for the app stores"
```

Or invoke directly:
```
/capacitor-wrap
```

The skill will guide you through:
1. Gathering app details (name, bundle ID, colors)
2. Installing Capacitor dependencies
3. Generating icons and splash screens
4. Configuring native platforms
5. Setting up RevenueCat (optional)
6. Creating build configurations
7. Generating store listing documentation

## What Gets Created

| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Main Capacitor configuration |
| `public/error.html` | Offline fallback page |
| `assets/*.png` | Source icons for generation |
| `lib/services/revenuecat.ts` | RevenueCat integration |
| `app/api/webhooks/revenuecat/route.ts` | Webhook handler |
| `codemagic.yaml` | iOS/Android CI/CD config |
| `docs/APP_STORE_GUIDE.md` | Store submission guide |
| `docs/SECRET_INFO.md` | Keystore passwords (**DO NOT COMMIT**) |
| `scripts/generate-app-icons.mjs` | Icon generation script |
| `android/` | Android native project |
| `android/*-release.keystore` | Release signing key (**DO NOT COMMIT**) |
| `ios/` | iOS native project |

## Prerequisites

### For the skill to work:
- Node.js 18+
- An existing web app (hosted URL or PWA)
- App icon (at least 512x512 PNG)

### For Android builds:
- JDK 17+
- Android Studio

### For iOS builds:
- **Option A**: macOS with Xcode 15+
- **Option B**: Codemagic account (free tier available)

## Build Commands

### Android Debug
```bash
cd android
./gradlew assembleDebug    # Windows: .\gradlew.bat assembleDebug
```

### Android Release (Signed for Play Store)

**Important**: You must set environment variables with your keystore credentials before building.

**Windows PowerShell:**
```powershell
$env:MYAPP_KEYSTORE_PATH = "C:\path\to\myapp-release.keystore"
$env:MYAPP_KEYSTORE_PASSWORD = "your-password"
$env:MYAPP_KEY_ALIAS = "myapp"
$env:MYAPP_KEY_PASSWORD = "your-password"
cd android
.\gradlew.bat bundleRelease
```

**macOS/Linux/Git Bash:**
```bash
MYAPP_KEYSTORE_PATH="/path/to/keystore" MYAPP_KEYSTORE_PASSWORD="pass" MYAPP_KEY_ALIAS="myapp" MYAPP_KEY_PASSWORD="pass" ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

> **Note**: The skill generates a keystore and stores credentials in `docs/SECRET_INFO.md`. Keep this file safe and never commit it!

### iOS (macOS)
```bash
npx cap open ios
# Build in Xcode: Product > Archive
```

### iOS (Codemagic)
Push to your repo's main branch - Codemagic builds automatically.

## RevenueCat Setup

When you enable RevenueCat integration, the skill creates:

1. **RevenueCat service** (`lib/services/revenuecat.ts`)
   - Initialize with user ID
   - Get subscription offerings
   - Purchase packages
   - Check entitlements
   - Restore purchases

2. **Webhook endpoint** (`app/api/webhooks/revenuecat/route.ts`)
   - Handle subscription events
   - Sync with your database

After running the skill, you'll need to:
1. Create a RevenueCat account at [app.revenuecat.com](https://app.revenuecat.com)
2. Add your iOS and Android apps
3. Create entitlements (e.g., `pro`, `elite`)
4. Copy your API keys to the generated service file
5. Set up products in App Store Connect and Google Play Console
6. Configure the webhook URL in RevenueCat

## Store Listing

The skill generates a complete `APP_STORE_GUIDE.md` with:
- Copy-paste store listing text
- Screenshot requirements
- Icon specifications
- In-app purchase setup instructions
- Deep link configuration
- Submission checklists

## Triggers

The skill activates when you mention:
- "capacitor"
- "app store"
- "play store"
- "wrap web app"
- "native app"
- "ios app"
- "android app"
- "pwa to native"

## Example Conversation

**You:** "I want to publish my fitness web app https://fitpro.app to the app stores"

**Claude:** "I'll help you wrap FitPro in Capacitor for app store deployment. Let me ask a few questions..."

**Claude:** Creates all configuration, generates icons, sets up builds, and provides store submission guide.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Created for use with [Claude Code](https://claude.ai/code) by Anthropic.
