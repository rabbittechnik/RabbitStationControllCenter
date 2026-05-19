# Control Center: Demo-Daten entfernt — Live-Anbindung

**Projekt:** RabbitStation Control Center (`Projekt Verkauf WEBAPP`)  
**Haupt-App:** unverändert  
**Control Center URL:** https://rabbitstationcontrollcenter-production.up.railway.app/

---

## 1. Wo waren Demo-Daten hinterlegt?

| Ort | Inhalt |
|-----|--------|
| `server/db/seed.ts` | Vier Demo-Tenants (Demo Station Nord, CityFuel Süd, …), Demo-Logs, Backup-Zeilen |
| `server/services/controlCenterDataService.ts` | `loadDemoOverview()` — SQLite + erfundene Abo-Zahlen (24 Tenants, Security 7/2) |
| `server/routes/controlCenter.ts` | Bei fehlender Config/API-Fehler → `loadDemoOverview()` |
| `server/routes/admin.ts` | Legacy `/api/admin/*` mit SQLite-Demo (Charts, Overview) |
| `server/services/health.ts` | `runHealthCheck()` / `getDemoHealthChart()` synthetische Werte |
| `src/pages/ControlCenterPage.tsx` | Charts über `/api/admin/charts` (immer Demo-Kurve) |

---

## 2. Entfernte Demo-Fallbacks

- `fetchLiveOverview()` fällt **nicht** mehr auf Demo zurück
- Alle `/api/control-center/*`-Routen liefern bei Fehler **503/502 + meta**, keine Demo-Tenants
- UI zeigt **„Nicht verfügbar“** / leere Listen statt erfundener Zahlen
- Demo-Modus-Banner (orange) entfernt → Fehlerbox rot mit ENV-Status
- Client: `getCharts()` an Legacy-Demo-Route entfernt

---

## 3. Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `server/services/rabbitStationApiClient.ts` | Getrennte ENV-Meldungen, `getConfigStatusDetails()` |
| `server/services/controlCenterDataService.ts` | Nur Live-Fetch, `buildErrorMeta()` |
| `server/routes/controlCenter.ts` | Kein `loadDemoOverview` |
| `server/types.ts` / `src/types/index.ts` | `source: 'live' \| 'error'`, `apiUrlSet`, `tokenSet` |
| `src/components/control-center/DataSourceBanner.tsx` | Konfigurations-/Verbindungsfehler-Box |
| `src/pages/ControlCenterPage.tsx` | Live-only Laden, Refresh, keine Demo-Charts |
| `src/api/client.ts` | `ApiRequestError` mit `meta`, kein Demo-Chart-Endpoint |
| `src/components/control-center/SubscriptionRevenueCards.tsx` | `unavailable`-Zustand |

`server/db/seed.ts` bleibt für lokale Login-Demo-User, wird **nicht** mehr in Control-Center-APIs ausgeliefert.

---

## 4. API-Proxy-Routen (serverseitig)

Browser → Control Center → Haupt-App:

| Control Center | Haupt-App |
|----------------|-----------|
| `GET /api/control-center/config-status` | ENV-Prüfung |
| `GET /api/control-center/overview` | Aggregat aller Admin-Endpunkte |
| `GET /api/control-center/health` | `/api/admin/health` + backups |
| `GET /api/control-center/tenants` | `/api/admin/tenants` |
| `GET /api/control-center/subscriptions/summary` | `/api/admin/subscriptions/summary` |
| `GET /api/control-center/logs` | `/api/admin/logs` |
| `GET /api/control-center/security/summary` | `/api/admin/security/summary` |
| `GET /api/control-center/backups/status` | `/api/admin/backups/status` |

Header (nur Server): `Authorization: Bearer ${CONTROL_CENTER_API_TOKEN}`

---

## 5. Railway ENV-Variablen

```env
RABBITSTATION_API_URL=https://client-production-cc0f.up.railway.app
CONTROL_CENTER_API_TOKEN=<geheimes-token>
SESSION_SECRET=<min-32-zeichen>
```

Optional: `PORT`, `HOST`, `DATABASE_PATH` (lokale CC-Session-DB)

**Wichtig:** In der **Haupt-App** muss derselbe Token für Admin-APIs konfiguriert sein (z. B. `CONTROL_CENTER_API_TOKEN` oder dokumentierter Service-Token).

---

## 6. UI ohne Verbindung

- Rote Box: **Konfiguration unvollständig** oder **Haupt-App nicht verbunden**
- Technische Zeilen: `RABBITSTATION_API_URL: gesetzt/fehlt`, `CONTROL_CENTER_API_TOKEN: gesetzt/fehlt`, letzter Fehler (401, Timeout, …)
- Keine Demo-Tenant-Tabelle, keine erfundenen Umsätze
- Status-Karten: Ladezustand, dann leer
- Tenants: „Tenants konnten nicht geladen werden.“
- Button **Aktualisieren** lädt erneut (ohne Demo-Fallback)

---

## 7. UI mit echten Daten

- Grüner **Live**-Hinweis
- Status aus Haupt-App-Health
- Echte Tenant-Liste aus `/api/admin/tenants`
- Abos/Umsatz aus Subscription-Summary (0 / „Noch keine Zahlungsdaten“ wenn leer)
- Logs und Security aus Admin-API
- Backup-Status inkl. „Backup-System noch nicht konfiguriert“ wenn API das meldet

---

## 8. Token nur serverseitig?

**Ja.** `CONTROL_CENTER_API_TOKEN` wird ausschließlich in `rabbitStationApiClient.ts` (Node `process.env`) verwendet und nicht an den Browser gesendet.

---

## 9. Haupt-App unverändert?

**Ja.** Es wurden keine Dateien in `Projekt Webapp Leer RabbitStation` geändert.

---

## Manuelle Checkliste nach Deploy

1. Railway: beide ENV-Variablen setzen, Redeploy Control Center  
2. CC öffnen → grüner Live-Banner oder klare Fehlermeldung (keine Demo-Tenants)  
3. Token falsch → 401 in „Letzter Fehler“, keine Demo-Daten  
4. URL falsch → Timeout/Netzwerkfehler, keine Demo-Daten  
5. Korrekte Konfiguration → echte Tenants der Haupt-App sichtbar
