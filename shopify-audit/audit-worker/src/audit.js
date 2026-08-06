import {
  createMobilePage,
  createDesktopPage,
  navigateWithTimeout,
  closePage,
  closeBrowser,
} from './browser.js';
import {
  checkCTAAboveFold,
  checkShippingVisibility,
  checkFreeShippingIncentive,
  checkReviewsVisibility,
  checkPagePerformance,
} from './rules.js';

async function findProductPage(page, storeUrl) {
  try {
    const links = await page.$$eval('a[href*="/products/"]', (anchors) =>
      anchors
        .map((a) => a.href)
        .filter((href) => !href.includes('/products/') || !href.endsWith('/products'))
        .slice(0, 5)
    );

    if (links.length > 0) {
      const productUrl = links[0];
      await navigateWithTimeout(page, productUrl);
      return productUrl;
    }

    const collectionLinks = await page.$$eval(
      'a[href*="/collections/"]',
      (anchors) => anchors.map((a) => a.href).slice(0, 3)
    );

    if (collectionLinks.length > 0) {
      await navigateWithTimeout(page, collectionLinks[0]);
      const productLinks = await page.$$eval('a[href*="/products/"]', (anchors) =>
        anchors.map((a) => a.href).slice(0, 3)
      );
      if (productLinks.length > 0) {
        await navigateWithTimeout(page, productLinks[0]);
        return productLinks[0];
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function auditStore(storeUrl) {
  const findings = [];

  try {
    // Mobile audit
    const { page: mobilePage, context: mobileCtx } = await createMobilePage();
    await navigateWithTimeout(mobilePage, storeUrl);

    const productUrl = await findProductPage(mobilePage, storeUrl);

    if (productUrl) {
      const mobileRules = [
        checkCTAAboveFold,
        checkShippingVisibility,
        checkFreeShippingIncentive,
        checkReviewsVisibility,
      ];

      for (const rule of mobileRules) {
        try {
          const result = await rule(mobilePage);
          if (result) findings.push(result);
        } catch (err) {
          console.error(`Rule check failed:`, err.message);
        }
      }
    }

    await closePage(mobileCtx);

    // Desktop audit (performance check)
    const { page: desktopPage, context: desktopCtx } = await createDesktopPage();
    await navigateWithTimeout(desktopPage, productUrl || storeUrl);

    try {
      const perfResult = await checkPagePerformance(desktopPage);
      if (perfResult) findings.push(perfResult);
    } catch (err) {
      console.error('Performance check failed:', err.message);
    }

    await closePage(desktopCtx);

    // Sort by severity
    const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
    findings.sort((a, b) => (severityRank[a.severity] ?? 4) - (severityRank[b.severity] ?? 4));

    return { findings, status: 'complete' };
  } catch (error) {
    return { findings, error: error.message, status: 'partial' };
  } finally {
    await closeBrowser();
  }
}
