import { Router } from 'express';
import { getDb } from '../db/index.js';
import type { SessionUser, UserRole } from '../types.js';

const router = Router();

router.get('/me', (req, res) => {
  if (!req.session?.user) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true, user: req.session.user });
});

router.post('/login', (req, res) => {
  const { email, role } = req.body as { email?: string; role?: UserRole };
  const db = getDb();

  let user: SessionUser | undefined;

  if (email) {
    const row = db
      .prepare('SELECT id, email, name, role FROM users WHERE email = ?')
      .get(email) as SessionUser | undefined;
    if (row) user = row;
  } else if (role) {
    const row = db
      .prepare('SELECT id, email, name, role FROM users WHERE role = ? LIMIT 1')
      .get(role) as SessionUser | undefined;
    if (row) user = row;
  } else {
    const row = db
      .prepare(`SELECT id, email, name, role FROM users WHERE role = 'saas_owner' LIMIT 1`)
      .get() as SessionUser;
    user = row;
  }

  if (!user) {
    res.status(401).json({ error: 'Benutzer nicht gefunden' });
    return;
  }

  req.session.user = user;
  res.json({ user });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
