import { Router } from 'express';
import { requireAuth, requireSaasAdmin } from '../middleware/auth.js';
import {
  fetchLiveBackups,
  fetchLiveHealth,
  fetchLiveLogs,
  fetchLiveOverview,
  fetchLiveSecurity,
  fetchLiveSubscriptions,
  fetchLiveTenants,
  loadDemoOverview,
} from '../services/controlCenterDataService.js';
import { getRabbitStationConfig, RabbitStationApiError } from '../services/rabbitStationApiClient.js';

const router = Router();
router.use(requireAuth, requireSaasAdmin);

function handleError(res: import('express').Response, e: unknown) {
  if (e instanceof RabbitStationApiError) {
    const status =
      e.code === 'config_missing' ? 503
      : e.code === 'unauthorized' || e.code === 'forbidden' ? e.status ?? 403
      : e.code === 'timeout' || e.code === 'network_error' ? 502
      : 500;
    return res.status(status).json({ error: e.message, code: e.code });
  }
  const msg = e instanceof Error ? e.message : 'Interner Fehler';
  return res.status(500).json({ error: msg });
}

router.get('/config-status', (_req, res) => {
  const cfg = getRabbitStationConfig();
  res.json({
    apiConfigured: cfg.ready,
    error: cfg.ready ? null : cfg.error,
  });
});

router.get('/overview', async (_req, res) => {
  try {
    const result = await fetchLiveOverview();
    res.json({ ...result.data, meta: result.meta });
  } catch (e) {
    handleError(res, e);
  }
});

router.get('/health', async (_req, res) => {
  try {
    const cfg = getRabbitStationConfig();
    if (!cfg.ready) {
      const demo = await loadDemoOverview(cfg.error);
      return res.json({ ...demo.data.health, meta: demo.meta });
    }
    const bundle = await fetchLiveHealth();
    res.json({
      ...bundle.health,
      meta: { source: 'live' as const, apiConfigured: true },
    });
  } catch (e) {
    handleError(res, e);
  }
});

router.get('/tenants', async (req, res) => {
  try {
    const cfg = getRabbitStationConfig();
    if (!cfg.ready) {
      const demo = await loadDemoOverview(cfg.error);
      let tenants = demo.data.tenants;
      const search = (req.query.search as string)?.toLowerCase() ?? '';
      if (search) tenants = tenants.filter((t) => t.name.toLowerCase().includes(search));
      return res.json({ tenants, meta: demo.meta, error: 'Tenants konnten nicht von der Haupt-App geladen werden.' });
    }
    const { tenants } = await fetchLiveTenants();
    const search = (req.query.search as string)?.toLowerCase() ?? '';
    const filtered = search
      ? tenants.filter((t) => t.name.toLowerCase().includes(search))
      : tenants;
    if (filtered.length === 0) {
      return res.json({
        tenants: [],
        meta: { source: 'live', apiConfigured: true },
        message: tenants.length === 0 ? 'Keine Tenants gefunden.' : undefined,
      });
    }
    res.json({ tenants: filtered, meta: { source: 'live', apiConfigured: true } });
  } catch (e) {
    if (e instanceof RabbitStationApiError) {
      return res.status(502).json({ error: 'Tenants konnten nicht geladen werden.', detail: e.message });
    }
    handleError(res, e);
  }
});

router.get('/subscriptions/summary', async (_req, res) => {
  try {
    const cfg = getRabbitStationConfig();
    if (!cfg.ready) {
      const demo = await loadDemoOverview(cfg.error);
      return res.json({ ...demo.data.subscriptions, meta: demo.meta });
    }
    const { subscriptions } = await fetchLiveSubscriptions();
    res.json({ ...subscriptions, meta: { source: 'live', apiConfigured: true } });
  } catch (e) {
    handleError(res, e);
  }
});

router.get('/logs', async (req, res) => {
  try {
    const cfg = getRabbitStationConfig();
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
    if (!cfg.ready) {
      const demo = await loadDemoOverview(cfg.error);
      return res.json({ logs: demo.data.logs, meta: demo.meta });
    }
    const { logs } = await fetchLiveLogs(limit);
    res.json({
      logs,
      meta: { source: 'live', apiConfigured: true },
      message: logs.length === 0 ? 'Keine aktuellen Meldungen.' : undefined,
    });
  } catch (e) {
    handleError(res, e);
  }
});

router.get('/security/summary', async (_req, res) => {
  try {
    const cfg = getRabbitStationConfig();
    if (!cfg.ready) {
      const demo = await loadDemoOverview(cfg.error);
      return res.json({ ...demo.data.security, meta: demo.meta });
    }
    const { security } = await fetchLiveSecurity();
    res.json({ ...security, meta: { source: 'live', apiConfigured: true } });
  } catch (e) {
    handleError(res, e);
  }
});

router.get('/backups/status', async (_req, res) => {
  try {
    const cfg = getRabbitStationConfig();
    if (!cfg.ready) {
      const demo = await loadDemoOverview(cfg.error);
      return res.json({ ...demo.data.backups, meta: demo.meta });
    }
    const { backups } = await fetchLiveBackups();
    res.json({ ...backups, meta: { source: 'live', apiConfigured: true } });
  } catch (e) {
    handleError(res, e);
  }
});

export default router;
