import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { getCachedResult, cacheResult } from '@/lib/redis';

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/results/[id]'>
) {
  try {
    const { id: jobId } = await ctx.params;

    const cached = await getCachedResult(jobId);
    if (cached) {
      return NextResponse.json(cached);
    }

    const supabase = getSupabaseServiceClient();
    const { data: audit, error } = await supabase
      .from('audits')
      .select('*, findings(*)')
      .eq('job_id', jobId)
      .single();

    if (error || !audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    const findings = (audit.findings || []).sort(
      (a: { severity: string }, b: { severity: string }) => {
        const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (rank[a.severity] ?? 4) - (rank[b.severity] ?? 4);
      }
    );

    const primaryFinding = findings.length > 0 ? findings[0] : null;

    const result = {
      jobId,
      auditId: audit.id,
      storeUrl: audit.store_url,
      storeName: audit.store_name,
      createdAt: audit.created_at,
      completedAt: audit.completed_at,
      status: audit.status,
      findings,
      primaryFinding,
      summary: {
        total: findings.length,
        critical: audit.critical_count || 0,
        high: audit.high_count || 0,
      },
    };

    if (audit.status === 'complete') {
      await cacheResult(jobId, result);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
