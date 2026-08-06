// CRR-01: Add-to-cart button above the fold on mobile
export async function checkCTAAboveFold(page) {
  try {
    const atcButton = await page.$(
      'button:has-text("Add to cart"), button:has-text("Add to Cart"), button:has-text("ADD TO CART"), [data-add-to-cart], form[action*="/cart/add"] button[type="submit"]'
    );
    if (!atcButton) return null;

    const boundingBox = await atcButton.boundingBox();
    if (!boundingBox) return null;

    const viewportHeight = (await page.viewportSize())?.height || 844;

    if (boundingBox.y + boundingBox.height > viewportHeight) {
      const pxBelow = Math.round(boundingBox.y + boundingBox.height - viewportHeight);
      return {
        rule_id: 'CRR-01',
        severity: 'critical',
        finding: `Add-to-cart button is ${pxBelow}px below the fold on mobile (iPhone 13). Buyer must scroll before reaching the purchase button.`,
        impact: 'On mobile (~65% of traffic), visitors scroll past the fold before they can complete purchase. High abandonment on mobile checkout.',
        recommendation: 'Implement sticky add-to-cart bar that remains visible as user scrolls, or condense product description to fit ATC above fold.',
        business_impact_score: 9,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// CRR-05: Shipping cost visibility on product page
export async function checkShippingVisibility(page) {
  try {
    const pageText = await page.textContent('body');
    if (!pageText) return null;

    const hasFreeShipping = /free shipping/i.test(pageText);
    const hasShippingCost = /shipping.*\$\d+/i.test(pageText) || /\$\d+.*shipping/i.test(pageText);
    const hasCalculatedAtCheckout = /shipping.*calculated.*checkout/i.test(pageText);

    if (hasCalculatedAtCheckout && !hasFreeShipping && !hasShippingCost) {
      return {
        rule_id: 'CRR-05',
        severity: 'critical',
        finding: 'Shipping cost is not visible on product page. Text only says "Shipping calculated at checkout".',
        impact: "Customers don't know shipping cost until they reach checkout. Hidden costs are the #1 reason for cart abandonment (48% of cases).",
        recommendation: "Add visible shipping cost estimate near ATC button. Example: 'FREE shipping on orders over $75' or dynamic cost estimate.",
        business_impact_score: 9,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// AOV-01: Free shipping threshold/incentive
export async function checkFreeShippingIncentive(page) {
  try {
    const pageText = await page.textContent('body');
    if (!pageText) return null;

    const hasFreeShippingThreshold =
      /free shipping (on|over|for) (orders )?\$\d+/i.test(pageText) ||
      /spend \$\d+.*free shipping/i.test(pageText);

    if (!hasFreeShippingThreshold) {
      return {
        rule_id: 'AOV-01',
        severity: 'high',
        finding: 'No free shipping threshold or incentive visible on the store.',
        impact: 'Stores without a visible free shipping threshold miss 15–25% of AOV uplift potential. Customers have no incentive to add more items.',
        recommendation: "Add a banner or cart drawer message: 'Free shipping on orders over $X' with a progress bar showing how close the customer is.",
        business_impact_score: 7,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// CRR-04: Social proof / reviews visibility
export async function checkReviewsVisibility(page) {
  try {
    const hasReviews = await page.$(
      '[class*="review"], [class*="rating"], [class*="star"], .yotpo, .judge-me, .stamped, .loox, [data-reviews], .spr-badge'
    );
    const pageText = await page.textContent('body') || '';
    const hasReviewText = /\d+\s*review/i.test(pageText) || /★/.test(pageText);

    if (!hasReviews && !hasReviewText) {
      return {
        rule_id: 'CRR-04',
        severity: 'high',
        finding: 'No customer reviews or ratings visible on the product page.',
        impact: 'Products without visible reviews see 30–40% lower conversion rates. Social proof is a top purchase decision factor.',
        recommendation: 'Add a review widget (Judge.me, Yotpo, Loox) with star ratings near the product title and full reviews below.',
        business_impact_score: 8,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// PERF-01: Page speed / performance check
export async function checkPagePerformance(page) {
  try {
    const metrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation');
      const nav = entries[0];
      if (!nav) return null;
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
        transferSize: nav.transferSize || 0,
      };
    });

    if (!metrics) return null;

    if (metrics.domContentLoaded > 4000) {
      return {
        rule_id: 'PERF-01',
        severity: 'high',
        finding: `Page takes ${(metrics.domContentLoaded / 1000).toFixed(1)}s to become interactive (DOMContentLoaded). Load complete: ${(metrics.loadComplete / 1000).toFixed(1)}s.`,
        impact: 'Pages loading over 3s lose 53% of mobile visitors. Each additional second of load time reduces conversions by 7%.',
        recommendation: 'Optimize images (WebP/AVIF), lazy-load below-fold content, minimize render-blocking scripts, and use a CDN.',
        business_impact_score: 7,
      };
    }
    return null;
  } catch {
    return null;
  }
}
