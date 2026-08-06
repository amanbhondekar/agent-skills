export interface Audit {
  id: string;
  job_id: string;
  store_url: string;
  store_name?: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  findings?: Finding[];
  created_at: string;
  completed_at?: string;
  duration_ms?: number;
  total_findings?: number;
  critical_count?: number;
  high_count?: number;
}

export interface Finding {
  id: string;
  audit_id: string;
  rule_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  finding: string;
  impact: string;
  recommendation: string;
  business_impact_score?: number;
  created_at: string;
}

export interface OutreachMessage {
  linkedin: { content: string; wordCount: number };
  email: { subject: string; body: string; wordCount: number };
  full: string;
}

export interface AuditRequest {
  storeUrl: string;
  prospectLinkedIn?: string;
}

export interface AuditResponse {
  jobId: string;
  auditId: string;
  statusUrl: string;
  estimatedTime: string;
}

export interface MessageRequest {
  primaryFinding: {
    finding: string;
    impact: string;
    recommendation: string;
  };
  prospectLinkedIn: string;
  storeUrl: string;
}
