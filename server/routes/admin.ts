import { Router } from 'express';
import { getDb } from '../db/index.js';
import { APP_BUILD, APP_REGION, APP_VERSION } from '../constants.js';
import { requireAuth, requireSaasAdmin, getClientMeta } from '../middleware/auth.js';
import { writeAuditLog } from '../services/audit.js';
import { runHealthCheck, getDemoHealthChart } from '../services/health.js';
import os from 'os';

const router = Router();
router.use(requireAuth, requireSaasAdmin);

router.get('/control-center/overview', async (req, res) => {
  const meta = getClientMeta(req);
  writeAuditLog({
    adminUserId: req.session.user!.id,
    action: 'control_center_opened',
    ...meta,
  });

  const health = await runHealthCheck();
  const db = getDb();

  const logs = db
    .prepare(
      `SELECT id, tenant_id, severity, category, action, message, created_at
       FROM system_logs ORDER BY created_at DESC LIMIT 10`,
    )
    .all();

  const tenants = db
    .prepare(`SELECT * FROM demo_tenants ORDER BY last_activity_minutes ASC`)
    .all();

  res.json({
    health,
    logs,
    tenants,
    subscriptions: getSubscriptionSummary(),
    security: getSecuritySummary(db),
    backups: getBackupStatus(db),
    systemInfo: getSystemInfo(),
    chartPeriod: '24h',
    charts: getDemoHealthChart('24h'),
  });
});

router.get('/health', async (_req, res) => {
  res.json(await runHealthCheck());
});

router.post('/health/run-check', async (_req, res) => {
  res.json(await runHealthCheck());
});

router.get('/tenants', (req, res) => {
  const db = getDb();
  const search = (req.query.search as string)?.toLowerCase() ?? '';
  let tenants = db.prepare(`SELECT * FROM demo_tenants ORDER BY name`).all() as Array<{
    id: string;
    name: string;
    status: string;
    plan: string;
    trial_end: string | null;
    employees: number;
    last_activity_minutes: number;
    locked: number;
  }>;

  if (search) {
    tenants = tenants.filter((t) => t.name.toLowerCase().includes(search));
  }

  res.json({ tenants });
});

router.get('/logs', (req, res) => {
  const db = getDb();
  const severity = req.query.severity as string | undefined;
  let query = `SELECT id, tenant_id, severity, category, action, message, created_at
               FROM system_logs`;
  const params: string[] = [];
  if (severity) {
    query += ` WHERE severity = ?`;
    params.push(severity);
  }
  query += ` ORDER BY created_at DESC LIMIT 50`;
  res.json({ logs: db.prepare(query).all(...params) });
});

router.get('/backups/status', (req, res) => {
  const db = getDb();
  res.json(getBackupStatus(db));
});

router.post('/backups/run-check', async (req, res) => {
  writeAuditLog({
    adminUserId: req.session.user!.id,
    action: 'backup_check_run',
    ...getClientMeta(req),
  });
  const health = await runHealthCheck();
  res.json({ status: health.backups.status, ...getBackupStatus(getDb()) });
});

router.get('/security/summary', (req, res) => {
  res.json(getSecuritySummary(getDb()));
});

router.get('/subscriptions/summary', (_req, res) => {
  res.json(getSubscriptionSummary());
});

router.get('/charts', (req, res) => {
  const period = (req.query.period as '24h' | '7d' | '30d') ?? '24h';
  res.json({ period, data: getDemoHealthChart(period) });
});

router.post('/tenants/:tenantId/support-session/start', (req, res) => {
  const { tenantId } = req.params;
  const { reason } = req.body as { reason?: string };
  const db = getDb();
  const meta = getClientMeta(req);

  const tenant = db
    .prepare('SELECT id, name FROM demo_tenants WHERE id = ?')
    .get(tenantId) as { id: string; name: string } | undefined;

  if (!tenant) {
    res.status(404).json({ error: 'Tenant nicht gefunden' });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO support_sessions (admin_user_id, tenant_id, reason, started_at, status, ip_address)
       VALUES (?, ?, ?, datetime('now'), 'active', ?)`,
    )
    .run(req.session.user!.id, tenantId, reason ?? 'Support-Zugriff', meta.ipAddress);

  writeAuditLog({
    adminUserId: req.session.user!.id,
    action: 'support_session_started',
    targetTenantId: tenantId,
    reason: reason ?? 'Support-Zugriff',
    ...meta,
  });

  db.prepare(
    `INSERT INTO system_logs (tenant_id, severity, category, action, message)
     VALUES (?, 'info', 'support', 'support_session_started', ?)`,
  ).run(
    tenantId,
    `Support-Zugriff für ${tenant.name} gestartet von ${req.session.user!.name}.`,
  );

  res.json({
    sessionId: result.lastInsertRowid,
    tenantId,
    status: 'active',
  });
});

router.post('/audit/control-center-opened', (req, res) => {
  writeAuditLog({
    adminUserId: req.session.user!.id,
    action: 'control_center_opened',
    ...getClientMeta(req),
  });
  res.json({ ok: true });
});

function getSubscriptionSummary() {
  return {
    activeTenants: 24,
    activeTenantsTrend: '+2 seit letztem Monat',
    trials: 6,
    trialsTrend: '-1 seit letztem Monat',
    activeSubscriptions: 21,
    activeSubscriptionsTrend: '+3 seit letztem Monat',
    monthlyRevenue: 12840,
    monthlyRevenueCurrency: 'EUR',
    monthlyRevenueTrend: '+18 % vs. letzter Monat',
  };
}

function getSecuritySummary(db: ReturnType<typeof getDb>) {
  const failedLogins = 7;
  const supportSessions = (
    db
      .prepare(`SELECT COUNT(*) as c FROM support_sessions WHERE status = 'active'`)
      .get() as { c: number }
  ).c;
  const roleChanges = 2;

  return { failedLogins24h: failedLogins, activeSupportSessions: supportSessions, roleChanges24h: roleChanges };
}

function getBackupStatus(db: ReturnType<typeof getDb>) {
  const last = db
    .prepare(`SELECT * FROM backup_logs ORDER BY finished_at DESC LIMIT 1`)
    .get() as {
    status: string;
    finished_at: string;
    size_bytes: number;
  } | undefined;

  const now = new Date();
  const next = new Date(now);
  next.setHours(22, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  return {
    lastBackupAt: last?.finished_at ?? new Date().toISOString(),
    lastBackupStatus: last?.status ?? 'success',
    nextBackupAt: next.toISOString(),
    sizeBytes: last?.size_bytes ?? 0,
  };
}

function getSystemInfo() {
  const uptimeSec = os.uptime();
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const load = Math.round((os.loadavg()[0] / os.cpus().length) * 100);

  return {
    environment: 'Produktion',
    region: `${APP_REGION} (Frankfurt)`,
    version: APP_VERSION,
    build: APP_BUILD,
    serverTime: new Date().toISOString(),
    uptime: `${days} Tage, ${hours} Std.`,
    systemLoadPercent: Math.min(load, 99),
    nodeVersion: process.version,
    databaseVersion: 'SQLite 3 (Demo)',
    lastDeploy: '2026-05-10T08:00:00.000Z',
    commitHash: 'a7f3c21',
  };
}

export default router;
