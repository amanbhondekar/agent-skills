import { chromium } from 'playwright';

let browser = null;

export async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }
  return browser;
}

export async function createMobilePage() {
  const b = await getBrowser();
  const context = await b.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  return { page, context };
}

export async function createDesktopPage() {
  const b = await getBrowser();
  const context = await b.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  return { page, context };
}

export async function navigateWithTimeout(page, url, timeout = 30000) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
  await page.waitForTimeout(2000);
}

export async function closePage(context) {
  await context.close();
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
