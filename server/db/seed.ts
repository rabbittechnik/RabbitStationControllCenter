import type Database from 'better-sqlite3';

const DEMO_TENANTS = [
  {
    id: 'tenant-demo-nord',
    name: 'Demo Station Nord',
    status: 'active',
    plan: 'pro',
    trial_end: '2026-06-17',
    employees: 12,
    last_activity_minutes: 2,
  },
  {
    id: 'tenant-cityfuel',
    name: 'CityFuel Süd',
    status: 'active',
    plan: 'pro',
    trial_end: null,
    employees: 18,
    last_activity_minutes: 5,
  },
  {
    id: 'tenant-tankpoint',
    name: 'TankPoint West',
    status: 'active',
    plan: 'basic',
    trial_end: '2026-06-05',
    employees: 7,
    last_activity_minutes: 8,
  },
  {
    id: 'tenant-expressfuel',
    name: 'ExpressFuel Mitte',
    status: 'trial',
    plan: 'pro',
    trial_end: '2026-05-18',
    employees: 4,
    last_activity_minutes: 12,
  },
];

const DEMO_LOGS = [
  {
    severity: 'warning',
    category: 'mail',
    action: 'smtp_delayed',
    message: 'SMTP Warnung: Verzögerte Zustellung – Zahlungsmails haben erhöhte Latenz.',
    minutesAgo: 5,
  },
  {
    severity: 'warning',
    category: 'trial',
    action: 'trial_expiring',
    message: 'Trial läuft heute ab – Demo Station Nord – Trial endet heute.',
    minutesAgo: 11,
    tenant_id: 'tenant-demo-nord',
  },
  {
    severity: 'error',
    category: 'security',
    action: 'login_failed',
    message: 'Login-Fehlversuche erkannt – 5 fehlgeschlagene Anmeldeversuche.',
    minutesAgo: 23,
  },
  {
    severity: 'success',
    category: 'backup',
    action: 'backup_completed',
    message: 'Backup erfolgreich – Tägliches Backup wurde erfolgreich abgeschlossen.',
    minutesAgo: 37,
  },
  {
    severity: 'info',
    category: 'support',
    action: 'support_session_started',
    message: 'Neue Unterstützungssitzung – Support-Zugriff für TankPoint West gestartet.',
    minutesAgo: 48,
    tenant_id: 'tenant-tankpoint',
  },
];

export function seedDatabase(database: Database.Database): void {
  const userCount = database.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (userCount.c === 0) {
    database
      .prepare(
        `INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)`,
      )
      .run(
        'admin-owner',
        'owner@rabbitstation.pro',
        'Admin Owner',
        'saas_owner',
        'admin-super',
        'super@rabbitstation.pro',
        'Super Admin',
        'saas_superadmin',
        'tenant-user-1',
        'manager@demostation.de',
        'Laura Sommer',
        'tenant_owner',
      );
  }

  const tenantCount = database.prepare('SELECT COUNT(*) as c FROM demo_tenants').get() as {
    c: number;
  };
  if (tenantCount.c === 0) {
    const insert = database.prepare(
      `INSERT INTO demo_tenants (id, name, status, plan, trial_end, employees, last_activity_minutes)
       VALUES (@id, @name, @status, @plan, @trial_end, @employees, @last_activity_minutes)`,
    );
    for (const t of DEMO_TENANTS) {
      insert.run(t);
    }
  }

  const logCount = database.prepare('SELECT COUNT(*) as c FROM system_logs').get() as { c: number };
  if (logCount.c === 0) {
    const insert = database.prepare(
      `INSERT INTO system_logs (tenant_id, severity, category, action, message, created_at)
       VALUES (@tenant_id, @severity, @category, @action, @message, datetime('now', @offset))`,
    );
    for (const log of DEMO_LOGS) {
      insert.run({
        tenant_id: log.tenant_id ?? null,
        severity: log.severity,
        category: log.category,
        action: log.action,
        message: log.message,
        offset: `-${log.minutesAgo} minutes`,
      });
    }
  }

  const backupCount = database.prepare('SELECT COUNT(*) as c FROM backup_logs').get() as {
    c: number;
  };
  if (backupCount.c === 0) {
    database
      .prepare(
        `INSERT INTO backup_logs (status, file_path, size_bytes, started_at, finished_at)
         VALUES ('success', '/backups/daily-2026-05-17.sql.gz', 2147483648, datetime('now', '-37 minutes'), datetime('now', '-35 minutes'))`,
      )
      .run();
  }

  const sessionCount = database
    .prepare(`SELECT COUNT(*) as c FROM support_sessions WHERE status = 'active'`)
    .get() as { c: number };
  if (sessionCount.c === 0) {
    database
      .prepare(
        `INSERT INTO support_sessions (admin_user_id, tenant_id, reason, started_at, status)
         VALUES ('admin-owner', 'tenant-demo-nord', 'Kundensupport', datetime('now', '-2 hours'), 'active'),
                ('admin-owner', 'tenant-cityfuel', 'Onboarding', datetime('now', '-45 minutes'), 'active'),
                ('admin-super', 'tenant-tankpoint', 'Technisches Problem', datetime('now', '-48 minutes'), 'active')`,
      )
      .run();
  }
}
