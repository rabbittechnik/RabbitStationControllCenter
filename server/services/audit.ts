import { getDb } from '../db/index.js';

export interface AuditEntry {
  adminUserId: string;
  action: string;
  targetTenantId?: string;
  targetUserId?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export function writeAuditLog(entry: AuditEntry): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO admin_audit_logs
     (admin_user_id, action, target_tenant_id, target_user_id, reason, ip_address, user_agent)
     VALUES (@adminUserId, @action, @targetTenantId, @targetUserId, @reason, @ipAddress, @userAgent)`,
  ).run({
    adminUserId: entry.adminUserId,
    action: entry.action,
    targetTenantId: entry.targetTenantId ?? null,
    targetUserId: entry.targetUserId ?? null,
    reason: entry.reason ?? null,
    ipAddress: entry.ipAddress ?? null,
    userAgent: entry.userAgent ?? null,
  });
}
