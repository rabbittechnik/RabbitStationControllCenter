import { Router } from 'express';
import { requireAuth, requireSaasAdmin } from '../middleware/auth.js';
import {
  buildErrorMeta,
  fetchLiveBackups,
  fetchLiveHealth,
  fetchLiveLogs,
  fetchLiveOverview,
  fetchLiveSecurity,
  fetchLiveSubscriptions,
  fetchLiveTenants,
  patchLiveTenantSubscription,
} from '../services/controlCenterDataService.js';
import {
  getConfigStatusDetails,
  getRabbitStationConfig,
  RabbitStationApiError,
} from '../services/rabbitStationApiClient.js';

const router = Router();
router.use(requireAuth, requireSaasAdmin);

function handleError(res: import('express').Response, e: unknown) {
  const meta = buildErrorMeta(e instanceof Error ? e.message : 'Unbekannter Fehler');
  if (e instanceof RabbitStationApiError) {
    const status =
      e.code === 'config_missing' ? 503
      : e.code === 'unauthorized' || e.code === 'forbidden' ? e.status ?? 403
      : e.code === 'timeout' || e.code === 'network_error' ? 502
      : e.code === 'not_found' ? 502
      : 500;
    return res.status(status).json({ error: e.message, code: e.code, meta });
  }
  const msg = e instanceof Error ? e.message : 'Interner Fehler';
  return res.status(500).json({ error: msg, meta });
}

router.get('/config-status', (_req, res) => {
  res.json(getConfigStatusDetails());
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
    const bundle = await fetchLiveHealth();
    res.json({
      ...bundle.health,
      backups: bundle.backups,
      systemInfo: bundle.systemInfo,
      meta: { source: 'live' as const, apiConfigured: true, apiUrlSet: true, tokenSet: true },
    });
  } catch (e) {
    handleError(res, e);
  }
});

router.get('/tenants', async (req, res) => {
  try {
    const { tenants } = await fetchLiveTenants();
    const search = (req.query.search as string)?.toLowerCase() ?? '';
    const filtered = search ? tenants.filter((t) => t.name.toLowerCase().includes(search)) : tenants;
    res.json({
      tenants: filtered,
      meta: { source: 'live', apiConfigured: true, apiUrlSet: true, tokenSet: true },
      message: filtered.length === 0 ? 'Keine Tenants gefunden.' : undefined,
    });
  } catch (e) {
    if (e instanceof RabbitStationApiError && (e.code === 'unauthorized' || e.code === 'forbidden')) {
      return res.status(e.status ?? 403).json({
        error: 'Zugriff auf Haupt-App Admin-API verweigert. Token prüfen.',
        code: e.code,
        meta: buildErrorMeta(e.message),
        tenants: [],
      });
    }
    if (e instanceof RabbitStationApiError) {
      return res.status(502).json({
        error: 'Tenants konnten nicht geladen werden.',
        detail: e.message,
        code: e.code,
        meta: buildErrorMeta(e.message),
        tenants: [],
      });
    }
    handleError(res, e);
  }
});

router.get('/subscriptions/summary', async (_req, res) => {
  try {
    const { subscriptions } = await fetchLiveSubscriptions();
    res.json({ ...subscriptions, meta: { source: 'live', apiConfigured: true, apiUrlSet: true, tokenSet: true } });
  } catch (e) {
    handleError(res, e);
  }
});

router.get('/logs', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
    const { logs } = await fetchLiveLogs(limit);
    res.json({
      logs,
      meta: { source: 'live', apiConfigured: true, apiUrlSet: true, tokenSet: true },
      message: logs.length === 0 ? 'Keine aktuellen Systemmeldungen.' : undefined,
    });
  } catch (e) {
    if (e instanceof RabbitStationApiError) {
      return res.status(502).json({
        error: 'Logs konnten nicht geladen werden.',
        detail: e.message,
        code: e.code,
        meta: buildErrorMeta(e.message),
        logs: [],
      });
    }
    handleError(res, e);
  }
});

router.get('/security/summary', async (_req, res) => {
  try {
    const { security } = await fetchLiveSecurity();
    res.json({ ...security, meta: { source: 'live', apiConfigured: true, apiUrlSet: true, tokenSet: true } });
  } catch (e) {
    handleError(res, e);
  }
});

router.patch('/tenants/:tenantId/subscription', async (req, res) => {
  try {
    const tenantId = String(req.params.tenantId ?? '');
    const body = req.body as Record<string, unknown>;
    await patchLiveTenantSubscription(tenantId, body);
    res.json({ ok: true, message: 'Plan wurde aktualisiert.' });
  } catch (e) {
    if (e instanceof RabbitStationApiError) {
      if (e.code === 'unauthorized' || e.code === 'forbidden') {
        return res.status(e.status ?? 403).json({
          error: 'Keine Berechtigung für Abo-Änderung.',
          code: e.code,
          meta: buildErrorMeta(e.message),
        });
      }
      if (
        e.code === 'timeout' ||
        e.code === 'network_error' ||
        e.code === 'not_found' ||
        e.code === 'server_error'
      ) {
        return res.status(502).json({
          error: 'Haupt-App nicht erreichbar.',
          code: e.code,
          meta: buildErrorMeta(e.message),
        });
      }
    }
    handleError(res, e);
  }
});

router.get('/backups/status', async (_req, res) => {
  try {
    const { backups } = await fetchLiveBackups();
    res.json({ ...backups, meta: { source: 'live', apiConfigured: true, apiUrlSet: true, tokenSet: true } });
  } catch (e) {
    handleError(res, e);
  }
});

export default router;
