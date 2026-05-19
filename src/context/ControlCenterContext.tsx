import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api/client';
import { normalizeOverviewData } from '../data/controlCenterDefaults';
import type { ControlCenterMeta, OverviewData } from '../types';

const AUTO_REFRESH_MS = 45_000;

export type ConfigDetails = {
  apiConfigured: boolean;
  apiUrlSet: boolean;
  tokenSet: boolean;
  error: string | null;
  apiUrlDisplay?: string | null;
  demoDataDisabled?: boolean;
  refreshIntervalMs?: number;
};

type ControlCenterContextValue = {
  data: OverviewData | null;
  meta: ControlCenterMeta | null;
  config: ConfigDetails | null;
  loading: boolean;
  refreshing: boolean;
  backupChecking: boolean;
  loadError: string | null;
  isLive: boolean;
  search: string;
  setSearch: (v: string) => void;
  refresh: () => Promise<void>;
  runBackupCheck: () => Promise<void>;
};

const ControlCenterContext = createContext<ControlCenterContextValue | null>(null);

function metaFromConfigStatus(cfg: ConfigDetails): ControlCenterMeta {
  return {
    source: cfg.apiConfigured ? 'live' : 'error',
    apiConfigured: cfg.apiConfigured,
    apiUrlSet: cfg.apiUrlSet,
    tokenSet: cfg.tokenSet,
    message: cfg.error ?? undefined,
    lastError: cfg.error ?? undefined,
  };
}

function metaFromApiFail(
  cfg: { apiUrlSet: boolean; tokenSet: boolean },
  message: string,
  code?: string,
): ControlCenterMeta {
  return {
    source: 'error',
    apiConfigured: true,
    apiUrlSet: cfg.apiUrlSet,
    tokenSet: cfg.tokenSet,
    message: 'Haupt-App nicht verbunden',
    lastError: code ? `${message} (${code})` : message,
  };
}

export function ControlCenterProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [meta, setMeta] = useState<ControlCenterMeta | null>(null);
  const [config, setConfig] = useState<ConfigDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backupChecking, setBackupChecking] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const isLive = meta?.source === 'live' && meta.apiConfigured === true;

  const loadAll = useCallback(async () => {
    setLoadError(null);

    const cfgResult = await api.getConfigStatus();
    if (!cfgResult.ok) {
      setConfig(null);
      setMeta({
        source: 'error',
        apiConfigured: false,
        apiUrlSet: false,
        tokenSet: false,
        message: cfgResult.message,
        lastError: cfgResult.message,
      });
      setData(null);
      return;
    }

    const cfg = cfgResult.data as ConfigDetails;
    setConfig(cfg);

    if (!cfg.apiConfigured) {
      setMeta(metaFromConfigStatus(cfg));
      setData(null);
      return;
    }

    const overviewResult = await api.getOverview();
    if (!overviewResult.ok) {
      const code = overviewResult.error;
      if (code === 'unauthorized' || code === 'forbidden') {
        setLoadError('Keine Berechtigung oder Token ungültig');
      } else {
        setLoadError(overviewResult.message);
      }
      setMeta(metaFromApiFail(cfg, overviewResult.message, code));
      setData(null);
      return;
    }

    const overview = overviewResult.data;
    const { meta: m, ...rest } = overview;
    setMeta(m ?? metaFromConfigStatus({ ...cfg, apiConfigured: true, error: null }));
    setData(normalizeOverviewData(rest));
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadAll();
      } catch (e) {
        console.error('[ControlCenter] load failed', e);
        setLoadError(e instanceof Error ? e.message : 'Daten konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAll]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadAll().catch((e) => console.warn('[ControlCenter] refresh failed', e));
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [loadAll]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  const runBackupCheck = useCallback(async () => {
    if (!isLive) return;
    setBackupChecking(true);
    try {
      const backups = await api.runBackupCheck();
      setData((prev) => (prev ? { ...prev, backups } : prev));
    } catch (e) {
      console.error('[ControlCenter] backup check failed', e);
      setLoadError(e instanceof Error ? e.message : 'Backup-Status konnte nicht geladen werden.');
    } finally {
      setBackupChecking(false);
    }
  }, [isLive]);

  const value = useMemo(
    () => ({
      data,
      meta,
      config,
      loading,
      refreshing,
      backupChecking,
      loadError,
      isLive,
      search,
      setSearch,
      refresh,
      runBackupCheck,
    }),
    [
      data,
      meta,
      config,
      loading,
      refreshing,
      backupChecking,
      loadError,
      isLive,
      search,
      refresh,
      runBackupCheck,
    ],
  );

  return (
    <ControlCenterContext.Provider value={value}>{children}</ControlCenterContext.Provider>
  );
}

export function useControlCenter() {
  const ctx = useContext(ControlCenterContext);
  if (!ctx) {
    throw new Error('useControlCenter must be used within ControlCenterProvider');
  }
  return ctx;
}
