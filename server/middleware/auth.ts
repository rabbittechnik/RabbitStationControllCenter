import type { Request, Response, NextFunction } from 'express';
import { SAAS_ADMIN_ROLES } from '../constants.js';
import type { SessionUser } from '../types.js';
import { writeAuditLog } from '../services/audit.js';

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.user) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return;
  }
  next();
}

export function requireSaasAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = req.session?.user;
  if (!user) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return;
  }

  if (!SAAS_ADMIN_ROLES.includes(user.role as (typeof SAAS_ADMIN_ROLES)[number])) {
    writeAuditLog({
      adminUserId: user.id,
      action: 'control_center_access_denied',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
      reason: `Unerlaubte Rolle: ${user.role}`,
    });
    res.status(403).json({ error: 'Zugriff verweigert – keine Plattform-Admin-Rolle' });
    return;
  }
  next();
}

export function getClientMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  };
}
