import { NextRequest } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/stream/[jobId]'>
) {
  const { jobId } = await ctx.params;
  const supabase = getSupabaseServiceClient();

  const { data: audit } = await supabase
    .from('audits')
    .select('id, status')
    .eq('job_id', jobId)
    .single();

  if (!audit) {
    return new Response('Job not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ event: 'connected', jobId })}\n\n`)
      );

      let pollCount = 0;
      const maxPolls = 20;

      const pollInterval = setInterval(async () => {
        pollCount++;

        try {
          const { data: currentAudit } = await supabase
            .from('audits')
            .select('status, total_findings, critical_count, high_count')
            .eq('id', audit.id)
            .single();

          if (currentAudit) {
            const event = {
              event: 'status-update',
              status: currentAudit.status,
              findings: currentAudit.total_findings || 0,
              critical: currentAudit.critical_count || 0,
              high: currentAudit.high_count || 0,
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );

            if (
              currentAudit.status === 'complete' ||
              currentAudit.status === 'failed'
            ) {
              clearInterval(pollInterval);
              controller.close();
            }
          }

          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ event: 'timeout' })}\n\n`
              )
            );
            controller.close();
          }
        } catch {
          clearInterval(pollInterval);
          controller.close();
        }
      }, 2000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
