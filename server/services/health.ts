import { getDb } from '../db/index.js';
import type { HealthResponse, HealthStatus } from '../types.js';

function computeOverall(parts: HealthStatus[]): HealthStatus {
  if (parts.includes('error')) return 'error';
  if (parts.includes('warning')) return 'warning';
  return 'ok';
}

export async function runHealthCheck(): Promise<HealthResponse> {
  const start = Date.now();
  const db = getDb();

  let dbOk = true;
  let connections = 0;
  try {
    db.prepare('SELECT 1').get();
    const row = db.prepare('SELECT COUNT(*) as c FROM demo_tenants').get() as { c: number };
    connections = Math.min(23, row.c + 19);
  } catch {
    dbOk = false;
  }

  const responseTimeMs = Math.round(Date.now() - start + 72 + Math.random() * 30);

  const now = new Date();
  const lastBackup = new Date(now);
  lastBackup.setHours(10, 42, 0, 0);
  const nextBackup = new Date(now);
  nextBackup.setHours(22, 0, 0, 0);
  if (nextBackup <= now) nextBackup.setDate(nextBackup.getDate() + 1);

  const paymentsStatus: HealthStatus = 'warning';
  const warnings =
    paymentsStatus === 'warning'
      ? ['Zahlungsanbieter meldet 2 offene Fälle']
      : [];

  const parts: HealthStatus[] = [
    'ok',
    'ok',
    dbOk ? 'ok' : 'error',
    'ok',
    paymentsStatus,
    'ok',
    'ok',
    'ok',
  ];

  const result: HealthResponse = {
    overallStatus: computeOverall(parts),
    checkedAt: now.toISOString(),
    app: { status: 'ok', message: 'App online' },
    api: { status: 'ok', responseTimeMs },
    database: {
      status: dbOk ? 'ok' : 'error',
      connections,
    },
    mail: { status: 'ok', deliveryRate: 99.9 },
    payments: { status: paymentsStatus, openCases: 2 },
    backups: {
      status: 'ok',
      lastBackupAt: lastBackup.toISOString(),
      nextBackupAt: nextBackup.toISOString(),
    },
    storage: {
      status: 'ok',
      usedPercent: 48,
      usedGb: 245,
      totalGb: 512,
    },
    uptime: { status: 'ok', percent30Days: 99.98 },
    warnings,
    errors: dbOk ? [] : ['Datenbankverbindung fehlgeschlagen'],
  };

  db.prepare(
    `INSERT INTO system_health_checks
     (overall_status, api_status, database_status, storage_status, mail_status,
      payment_status, backup_status, uptime_status, checked_at, details_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    result.overallStatus,
    result.api.status,
    result.database.status,
    result.storage.status,
    result.mail.status,
    result.payments.status,
    result.backups.status,
    result.uptime.status,
    result.checkedAt,
    JSON.stringify(result),
  );

  return result;
}

export function getDemoHealthChart(period: '24h' | '7d' | '30d') {
  const points =
    period === '30d' ? 30 : period === '7d' ? 7 : 24;
  const label =
    period === '30d' ? 'Tag' : period === '7d' ? 'Tag' : 'Stunde';

  return Array.from({ length: points }, (_, i) => {
    const base = 120 + Math.sin(i * 0.7) * 180;
    return {
      label: `${label} ${i + 1}`,
      responseTimeMs: Math.round(base + Math.random() * 80),
      errorRate: Number((Math.random() * 0.8 + (i % 7 === 0 ? 1.2 : 0)).toFixed(2)),
      requests: Math.round(800 + Math.random() * 2200 + Math.sin(i) * 400),
    };
  });
}
