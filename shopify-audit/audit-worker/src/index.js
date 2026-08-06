import express from 'express';
import cors from 'cors';
import { auditStore } from './audit.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'shopify-audit-worker', timestamp: new Date().toISOString() });
});

app.post('/audit', async (req, res) => {
  const { storeUrl, auditId, jobId } = req.body;

  if (!storeUrl) {
    return res.status(400).json({ error: 'storeUrl is required' });
  }

  console.log(`[${jobId}] Starting audit for ${storeUrl}`);
  const startTime = Date.now();

  try {
    const result = await auditStore(storeUrl);
    const duration = Date.now() - startTime;

    console.log(`[${jobId}] Audit completed in ${duration}ms — ${result.findings.length} findings`);

    res.json({
      auditId,
      jobId,
      findings: result.findings,
      duration,
      status: 'complete',
    });
  } catch (error) {
    console.error(`[${jobId}] Audit failed:`, error.message);
    res.status(500).json({
      auditId,
      jobId,
      error: error.message,
      status: 'failed',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Worker listening on port ${PORT}`);
});
