import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'shopify-audit-api',
    timestamp: new Date().toISOString(),
  });
}
