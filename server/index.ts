import fs from 'node:fs';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, getDbPathForLogs } from './db/index.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import controlCenterRoutes from './routes/controlCenter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST?.trim() || '0.0.0.0';

try {
  getDb();
} catch (err) {
  console.error('[startup] Datenbank konnte nicht geöffnet werden:', err);
  process.exit(1);
}

app.set('trust proxy', 1);
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }),
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'rabbitstation-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    },
  }),
);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/control-center', controlCenterRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rabbitstation-api' });
});

function resolveClientDist(): string {
  const candidates = [
    path.join(__dirname, '../client'),
    path.join(process.cwd(), 'dist', 'client'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) return dir;
  }
  return candidates[0];
}

const clientDist = resolveClientDist();
const indexHtml = path.join(clientDist, 'index.html');

if (!fs.existsSync(indexHtml)) {
  console.error(`[startup] Frontend fehlt: ${indexHtml} (bitte npm run build ausführen)`);
}

app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (!fs.existsSync(indexHtml)) {
    res.status(503).send('Frontend nicht gebaut. Bitte Deploy-Logs prüfen (npm run build).');
    return;
  }
  res.sendFile(indexHtml, (err) => {
    if (err) next(err);
  });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[http]', err);
  if (!res.headersSent) res.status(500).send('Interner Serverfehler');
});

app.listen(PORT, HOST, () => {
  console.log(`RabbitStation Control Center läuft auf http://${HOST}:${PORT}`);
  console.log(`[startup] SQLite: ${getDbPathForLogs()}`);
  console.log(`[startup] Frontend: ${clientDist}`);
});
