import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { isValidShopifyUrl, extractStoreName } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeUrl } = body;

    if (!storeUrl) {
      return NextResponse.json(
        { error: 'Missing storeUrl' },
        { status: 400 }
      );
    }

    if (!isValidShopifyUrl(storeUrl)) {
      return NextResponse.json(
        { error: 'URL must be a Shopify store (.myshopify.com)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    const jobId = `audit_${Date.now()}`;
    const storeName = extractStoreName(storeUrl);

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        job_id: jobId,
        store_url: storeUrl,
        store_name: storeName,
        status: 'pending',
      })
      .select()
      .single();

    if (auditError) throw auditError;

    // Dispatch to worker (in production, this goes through Trigger.dev)
    // For MVP, we call the worker directly
    const workerUrl = process.env.WORKER_URL || 'http://localhost:3001';
    fetch(`${workerUrl}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeUrl,
        auditId: audit.id,
        jobId,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error('Worker error:', res.status);
          await supabase
            .from('audits')
            .update({ status: 'failed' })
            .eq('id', audit.id);
          return;
        }

        const result = await res.json();

        if (result.findings && result.findings.length > 0) {
          const findings = result.findings.map(
            (f: { rule_id: string; severity: string; finding: string; impact: string; recommendation: string; business_impact_score?: number }) => ({
              audit_id: audit.id,
              rule_id: f.rule_id,
              severity: f.severity,
              finding: f.finding,
              impact: f.impact,
              recommendation: f.recommendation,
              business_impact_score: f.business_impact_score || null,
            })
          );

          await supabase.from('findings').insert(findings);
        }

        const criticalCount = (result.findings || []).filter(
          (f: { severity: string }) => f.severity === 'critical'
        ).length;
        const highCount = (result.findings || []).filter(
          (f: { severity: string }) => f.severity === 'high'
        ).length;

        await supabase
          .from('audits')
          .update({
            status: 'complete',
            completed_at: new Date().toISOString(),
            total_findings: result.findings?.length || 0,
            critical_count: criticalCount,
            high_count: highCount,
            duration_ms: result.duration || null,
          })
          .eq('id', audit.id);
      })
      .catch(async (err) => {
        console.error('Worker dispatch error:', err);
        await supabase
          .from('audits')
          .update({ status: 'failed' })
          .eq('id', audit.id);
      });

    await supabase
      .from('audits')
      .update({ status: 'running' })
      .eq('id', audit.id);

    return NextResponse.json({
      jobId,
      auditId: audit.id,
      statusUrl: `/api/stream/${jobId}`,
      estimatedTime: '25–30 seconds',
    });
  } catch (error) {
    console.error('Audit request error:', error);
    return NextResponse.json(
      { error: 'Failed to start audit' },
      { status: 500 }
    );
  }
}
