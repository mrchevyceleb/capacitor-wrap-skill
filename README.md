# Capacitor Wrap Skill for Claude Code

A Claude Code skill that wraps any web app in Capacitor for iOS and Android app store deployment, with optional RevenueCat subscription integration.

## Features

- **One-command setup**: Installs and configures Capacitor for any web app
- **Automated keystore generation**: Secure Android signing with auto-generated credentials
- **Icon generation**: Creates all required app store icon sizes from a single source
- **Screenshot automation**: **NEW in v2.3** - Automated Playwright-based screenshot generation for iOS and Android
- **RevenueCat integration**: Optional in-app subscription support
- **Cross-platform builds**: Works on Windows and macOS
- **Cloud CI/CD**: Codemagic configuration for iOS builds without a Mac
- **Store-ready**: Generates copy-paste store listing text and deployment guides

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
1. Gathering app details (name, iOS bundle ID, Android package name, colors)
2. Installing Capacitor dependencies
3. Generating icons and splash screens
4. **Automatically generating app store screenshots using Playwright** (NEW in v2.3)
5. Configuring native platforms with separate bundle identifiers
6. **Automatically generating Android keystore with secure passwords**
7. Setting up RevenueCat (optional)
8. Creating build configurations
9. Generating comprehensive store listing documentation and deployment guides

**Important**: The skill now properly handles separate bundle IDs for iOS and Android:
- iOS uses bundle ID (e.g., `app.company.appname` or `ai.carouselcards.app`)
- Android uses package name (e.g., `com.company.appname`)
- These identifiers are PERMANENT and cannot be changed after app store submission

## What Gets Created

| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Main Capacitor configuration |
| `public/error.html` | Offline fallback page |
| `assets/*.png` | Source icons for generation |
| `lib/services/revenuecat.ts` | RevenueCat integration (optional) |
| `app/api/webhooks/revenuecat/route.ts` | Webhook handler (optional) |
| `codemagic.yaml` | iOS/Android CI/CD config |
| `docs/APP_STORE_GUIDE.md` | Store submission guide |
| `scripts/generate-app-icons.mjs` | Icon generation script |
| `scripts/generate-app-screenshots.mjs` | **NEW:** Automated screenshot generator |
| `screenshots/ios/*.png` | **NEW:** iOS App Store screenshots |
| `screenshots/android/*.png` | **NEW:** Android Play Store screenshots |
| `android/` | Android native project |
| `android-signing/` | **Android signing folder** (DO NOT COMMIT) |
| `android-signing/*.keystore` | Auto-generated release signing key |
| `android-signing/CREDENTIALS.txt` | Auto-generated passwords and setup values |
| `android-signing/SETUP-INSTRUCTIONS.md` | Step-by-step Codemagic/Google Play guide |
| `ios/` | iOS native project |

## Prerequisites

### For the skill to work:
- Node.js 22+ (Capacitor 8 requirement)
- An existing web app (hosted URL or PWA)
- App icon (at least 512x512 PNG)
- iOS bundle ID and Android package name (permanent identifiers)

### For Android builds:
- JDK 21 (Capacitor 8 requirement)
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

**Important**: The skill automatically generates a secure keystore and saves credentials to `android-signing/CREDENTIALS.txt`.

**Windows PowerShell:**
```powershell
# Get credentials from android-signing/CREDENTIALS.txt
$KEYSTORE_PATH = (Resolve-Path android-signing\myapp-release.keystore).Path
$env:MYAPP_KEYSTORE_PATH = $KEYSTORE_PATH
$env:MYAPP_KEYSTORE_PASSWORD = "your-password-from-credentials-file"
$env:MYAPP_KEY_ALIAS = "myapp"
$env:MYAPP_KEY_PASSWORD = "your-password-from-credentials-file"
cd android
.\gradlew.bat bundleRelease
```

**macOS/Linux/Git Bash:**
```bash
# Get credentials from android-signing/CREDENTIALS.txt
export MYAPP_KEYSTORE_PATH="$(pwd)/android-signing/myapp-release.keystore"
export MYAPP_KEYSTORE_PASSWORD="your-password-from-credentials-file"
export MYAPP_KEY_ALIAS="myapp"
export MYAPP_KEY_PASSWORD="your-password-from-credentials-file"
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

**New in v2.2**: The skill automatically:
- Generates a cryptographically secure 32-character password
- Creates the keystore non-interactively (no manual prompts!)
- Saves all credentials to `android-signing/CREDENTIALS.txt`
- Creates `android-signing/SETUP-INSTRUCTIONS.md` with step-by-step Codemagic and Google Play setup
- Provides ready-to-paste values for CI/CD configuration

> **Security Note**: The `android-signing/` folder contains everything needed to sign your app. Back it up securely and never commit it to git!

### iOS (macOS)
```bash
npx cap open ios
# Build in Xcode: Product > Archive
```

### iOS (Codemagic)
Push to your repo's main branch - Codemagic builds automatically.

## Screenshot Generation (NEW in v2.3)

The skill now includes automated screenshot generation for both iOS and Android app stores using Playwright.

### Quick Start

```bash
# Install Playwright
npm install -D playwright
npx playwright install chromium

# Start your app
npm run dev

# Generate screenshots (in another terminal)
node scripts/generate-app-screenshots.mjs
```

### What Gets Generated

**iOS Screenshots:**
- 6.9" iPhone (1320x2868) - **Mandatory for 2026**
- 6.7" iPhone (1290x2796)
- 6.5" iPhone (1242x2688)
- 5.5" iPhone (1242x2208)
- 13" iPad Pro (2064x2752) - **Mandatory for 2026**
- 12.9" iPad Pro (2048x2732)

**Android Screenshots:**
- Phone portrait: 1080x1920, 1440x2560
- Phone landscape: 1920x1080
- Tablet 7": 1200x1920
- Tablet 10": 1600x2560

### Customization

Edit `scripts/generate-app-screenshots.mjs` to customize:
- App URL (local or production)
- Screenshot scenarios (which screens to capture)
- Custom actions before screenshots (e.g., click buttons, fill forms)
- Wait times and selectors

Example scenario configuration:
```javascript
scenarios: [
  {
    name: 'home',
    description: 'Home Screen',
    path: '/',
    waitForSelector: '.main-content',
  },
  {
    name: 'feature',
    description: 'Key Feature',
    path: '/feature',
    waitForSelector: '.feature-container',
    actions: async (page) => {
      await page.click('#demo-button');
      await page.waitForTimeout(1000);
    }
  }
]
```

### App Store Requirements

**Apple App Store (2026):**
- Mandatory: 6.9" iPhone + 13" iPad Pro
- 1-10 screenshots per device size
- PNG or JPEG, 72 DPI, no transparency

**Google Play Store:**
- Minimum: 2 screenshots (1080x1920 or higher)
- Recommended: 4-8 screenshots
- 24-bit PNG or JPEG, max 8MB

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
2. Add your iOS app with iOS bundle ID
3. Add your Android app with Android package name
4. Create entitlements (e.g., `pro`, `elite`)
5. Copy your platform-specific API keys to the generated service file
6. Set up products in App Store Connect and Google Play Console
7. Configure the webhook URL in RevenueCat

**Note**: RevenueCat requires separate app entries for iOS and Android with their respective bundle identifiers.

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

## Troubleshooting

Encountering issues with iOS deployment? We've documented solutions from real-world deployment experience:

### Documentation

- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Comprehensive troubleshooting guide
  - Code signing conflicts and certificate management
  - Build number conflicts
  - App icon requirements
  - RevenueCat Capacitor 8 compatibility
  - Complete working workflow examples
  - Common error messages and solutions

- **[IOS_DEPLOYMENT_LEARNINGS.md](IOS_DEPLOYMENT_LEARNINGS.md)** - Real-world deployment learnings
  - Timeline of issues encountered and resolved
  - Battle-tested workflow configuration
  - One-time setup checklist
  - Key takeaways and best practices

### Quick Solutions

| Error | Solution |
|-------|----------|
| "Cannot save Signing Certificates" | Remove `ios_signing` block from environment section |
| Duplicate build numbers | Use timestamp-based build numbers |
| App icon errors | Verify 1024x1024 icon has `"idiom": "ios-marketing"` |
| RevenueCat compatibility | Use base package only (not UI package) |
| Certificate limit reached | Reuse certificate key via env var |

See the full guides for detailed explanations and complete solutions.

---

**Last Updated:** January 2026 (v2.3) - Added automated screenshot generation for iOS and Android app stores with Playwright, supporting all required 2026 dimensions including mandatory 6.9" iPhone and 13" iPad Pro
