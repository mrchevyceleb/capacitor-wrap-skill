/**
 * Automated Screenshot Generator for App Stores
 *
 * Generates screenshots for both Apple App Store and Google Play Store
 * using Playwright for browser automation.
 *
 * Usage:
 *   node scripts/generate-app-screenshots.mjs
 *
 * Requirements:
 *   npm install -D playwright
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Configuration - customize these for your app
const CONFIG = {
  // Your app URL (local dev server or deployed URL)
  appUrl: process.env.APP_URL || 'http://localhost:5173',

  // Wait time for page to load before screenshot (ms)
  loadWaitTime: 2000,

  // Output directories
  outputDir: 'screenshots',
  iosDir: 'screenshots/ios',
  androidDir: 'screenshots/android',

  // Screenshot scenarios - customize these for your app's key screens
  scenarios: [
    {
      name: 'home',
      description: 'Home Screen',
      path: '/',
      waitForSelector: 'body', // Adjust to your app's main content selector
    },
    {
      name: 'feature-1',
      description: 'Main Feature',
      path: '/', // Adjust path
      waitForSelector: 'body',
      // Optional: actions to perform before screenshot
      actions: async (page) => {
        // Example: await page.click('#feature-button');
        // Example: await page.waitForTimeout(1000);
      }
    },
    {
      name: 'feature-2',
      description: 'Secondary Feature',
      path: '/',
      waitForSelector: 'body',
    },
    {
      name: 'user-flow',
      description: 'Key User Flow',
      path: '/',
      waitForSelector: 'body',
    },
  ],
};

// Apple App Store screenshot dimensions (2026 requirements)
// 6.9" iPhone (iPhone 15 Pro Max, 16 Pro Max) - MANDATORY
const IOS_SIZES = [
  { name: 'iphone-6.9', width: 1320, height: 2868, label: '6.9" iPhone (Mandatory)' },
  { name: 'iphone-6.7', width: 1290, height: 2796, label: '6.7" iPhone (14 Pro Max, 15 Plus)' },
  { name: 'iphone-6.5', width: 1242, height: 2688, label: '6.5" iPhone (XS Max, 11 Pro Max)' },
  { name: 'iphone-5.5', width: 1242, height: 2208, label: '5.5" iPhone (8 Plus)' },
  { name: 'ipad-13', width: 2064, height: 2752, label: '13" iPad Pro (Mandatory)' },
  { name: 'ipad-12.9', width: 2048, height: 2732, label: '12.9" iPad Pro' },
];

// Google Play Store screenshot dimensions (2026 requirements)
// Minimum 2 screenshots, up to 8 allowed
const ANDROID_SIZES = [
  { name: 'phone-portrait', width: 1080, height: 1920, label: 'Phone Portrait (16:9)' },
  { name: 'phone-portrait-hd', width: 1440, height: 2560, label: 'Phone Portrait HD' },
  { name: 'phone-landscape', width: 1920, height: 1080, label: 'Phone Landscape (16:9)' },
  { name: 'tablet-portrait', width: 1200, height: 1920, label: 'Tablet 7" Portrait' },
  { name: 'tablet-portrait-10', width: 1600, height: 2560, label: 'Tablet 10" Portrait' },
];

/**
 * Create output directories if they don't exist
 */
function setupDirectories() {
  [CONFIG.outputDir, CONFIG.iosDir, CONFIG.androidDir].forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
}

/**
 * Generate screenshots for a specific platform
 */
async function generateScreenshots(browser, platform, sizes) {
  console.log(`\n📱 Generating ${platform} screenshots...\n`);

  const outputDir = platform === 'iOS' ? CONFIG.iosDir : CONFIG.androidDir;
  let totalGenerated = 0;

  for (const scenario of CONFIG.scenarios) {
    console.log(`  Scenario: ${scenario.description}`);

    for (const size of sizes) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: 2, // Retina display
      });

      const page = await context.newPage();

      try {
        // Navigate to the page
        const url = `${CONFIG.appUrl}${scenario.path}`;
        await page.goto(url, { waitUntil: 'networkidle' });

        // Wait for specific selector
        await page.waitForSelector(scenario.waitForSelector, { timeout: 10000 });

        // Additional wait for animations/loading
        await page.waitForTimeout(CONFIG.loadWaitTime);

        // Execute custom actions if provided
        if (scenario.actions) {
          await scenario.actions(page);
          await page.waitForTimeout(1000); // Wait for action effects
        }

        // Generate filename
        const filename = `${scenario.name}-${size.name}.png`;
        const filepath = join(outputDir, filename);

        // Take screenshot
        await page.screenshot({
          path: filepath,
          fullPage: false, // Only viewport, not full scrollable page
        });

        console.log(`    ✓ ${filename} (${size.width}x${size.height})`);
        totalGenerated++;

      } catch (error) {
        console.error(`    ✗ Error capturing ${scenario.name} at ${size.name}:`, error.message);
      } finally {
        await context.close();
      }
    }
  }

  console.log(`\n  Total ${platform} screenshots generated: ${totalGenerated}`);
  return totalGenerated;
}

/**
 * Generate summary report
 */
function generateReport(iosCount, androidCount) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Screenshot Generation Summary');
  console.log('='.repeat(60));
  console.log(`\n📱 iOS Screenshots: ${iosCount}`);
  console.log(`   Location: ${CONFIG.iosDir}/`);
  console.log(`   Required: At least 1 x 6.9" iPhone + 1 x 13" iPad`);
  console.log(`\n🤖 Android Screenshots: ${androidCount}`);
  console.log(`   Location: ${CONFIG.androidDir}/`);
  console.log(`   Required: Minimum 2 screenshots (1080x1920 or higher)`);
  console.log(`\n✅ Total Screenshots: ${iosCount + androidCount}`);
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Next Steps:');
  console.log('   1. Review generated screenshots in the directories above');
  console.log('   2. Customize scenarios in this script for your app\'s screens');
  console.log('   3. Upload to App Store Connect (iOS) and Google Play Console (Android)');
  console.log('   4. Add captions/localization in respective consoles');
  console.log('\n💡 Tips:');
  console.log('   - iOS: Provide 6.9" iPhone and 13" iPad (mandatory in 2026)');
  console.log('   - Android: Minimum 2, maximum 8 screenshots per language');
  console.log('   - Use high-quality, engaging screenshots showing key features');
  console.log('   - Consider adding text overlays for context (optional)');
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting App Store Screenshot Generation\n');
  console.log(`   App URL: ${CONFIG.appUrl}`);
  console.log(`   Scenarios: ${CONFIG.scenarios.length}`);
  console.log(`   iOS Sizes: ${IOS_SIZES.length}`);
  console.log(`   Android Sizes: ${ANDROID_SIZES.length}`);

  // Setup directories
  setupDirectories();

  // Launch browser
  console.log('\n🌐 Launching browser...');
  const browser = await chromium.launch({ headless: true });

  try {
    // Generate iOS screenshots
    const iosCount = await generateScreenshots(browser, 'iOS', IOS_SIZES);

    // Generate Android screenshots
    const androidCount = await generateScreenshots(browser, 'Android', ANDROID_SIZES);

    // Generate report
    generateReport(iosCount, androidCount);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }

  console.log('✅ Screenshot generation complete!\n');
}

// Run the script
main().catch(console.error);
