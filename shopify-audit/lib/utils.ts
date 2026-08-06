export function isValidShopifyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes('myshopify.com') ||
      parsed.hostname.includes('shopify.app')
    );
  } catch {
    return false;
  }
}

export function extractStoreName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.split('.')[0];
  } catch {
    return 'unknown';
  }
}

export function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-green-600 bg-green-50 border-green-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function severityRank(severity: string): number {
  switch (severity) {
    case 'critical': return 0;
    case 'high': return 1;
    case 'medium': return 2;
    case 'low': return 3;
    default: return 4;
  }
}
