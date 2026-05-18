# Control Center – Anbindung Haupt-App

Stand: Mai 2026 · Projekt: **RabbitStation Control Center** · Haupt-App nicht geändert.

---

## 1. Geänderte Dateien (Control Center)

| Bereich | Dateien |
|---------|---------|
| API-Client | `server/services/rabbitStationApiClient.ts` |
| Mapper | `server/services/rabbitStationMappers.ts` |
| Datenservice | `server/services/controlCenterDataService.ts` |
| Proxy-Routen | `server/routes/controlCenter.ts` |
| Server | `server/index.ts`, `server/types.ts` |
| Frontend API | `src/api/client.ts` |
| UI | `src/pages/ControlCenterPage.tsx`, `DataSourceBanner.tsx`, Anpassungen an Status-/Tenant-/Log-/Backup-Komponenten |
| Konfiguration | `.env.example` |

---

## 2. API-Proxy-Routen (Control Center)

| Control Center | Methode |
|----------------|---------|
| `/api/control-center/config-status` | GET |
| `/api/control-center/overview` | GET (bündelt alle Bereiche) |
| `/api/control-center/health` | GET |
| `/api/control-center/tenants` | GET |
| `/api/control-center/subscriptions/summary` | GET |
| `/api/control-center/logs` | GET |
| `/api/control-center/security/summary` | GET |
| `/api/control-center/backups/status` | GET |

Alle Routen erfordern **Control-Center-Login** (`saas_owner` / `saas_superadmin`).

---

## 3. Aufgerufene Haupt-App-Routen

| Proxy | Haupt-App |
|-------|-----------|
| health | `GET /api/admin/health` |
| tenants | `GET /api/admin/tenants` |
| subscriptions/summary | `GET /api/admin/subscriptions/summary` |
| logs | `GET /api/admin/logs?limit=…` |
| security/summary | `GET /api/admin/security/summary` |
| backups/status | `GET /api/admin/backups/status` |

Basis-URL: `RABBITSTATION_API_URL` (ohne trailing slash).

---

## 4. ENV-Variablen

| Variable | Beispiel |
|----------|----------|
| `RABBITSTATION_API_URL` | `https://client-production-cc0f.up.railway.app` |
| `CONTROL_CENTER_API_TOKEN` | Geheimnis (nur Server) |
| `SESSION_SECRET` | Control-Center-Session |
| `DATABASE_PATH` | optional, lokale Demo-DB |

Fehlermeldungen:

- URL fehlt → „RabbitStation API URL ist nicht konfiguriert.“
- Token fehlt → „Control-Center API Token fehlt.“

---

## 5. Fehlerdarstellung

- **Banner oben:** Live (grün), Demo-Modus (orange) oder Konfiguration fehlt (rot)
- **API nicht erreichbar:** Demo-Fallback + Fehlertext + „Erneut prüfen“
- **Tenant/Logs leer:** „Keine Tenants gefunden.“ / „Keine aktuellen Meldungen.“
- **Health:** orange/rot bei Ausfall, fehlende Felder als „Unbekannt“
- **Umsatz 0:** „Noch keine Zahlungsdaten verfügbar“

Auto-Refresh alle **45 Sekunden** (dezent).

---

## 6. Token-Sicherheit

- `CONTROL_CENTER_API_TOKEN` wird **nur serverseitig** gelesen (`rabbitStationApiClient.ts`).
- Das Frontend ruft ausschließlich `/api/control-center/*` auf – **kein Token im Browser**.
- Nicht in Git committen (nur `.env.example` mit Platzhaltern).

---

## 7. Railway (Control Center Service)

Variablen setzen:

```
RABBITSTATION_API_URL=https://client-production-cc0f.up.railway.app
CONTROL_CENTER_API_TOKEN=<geheim>
SESSION_SECRET=<geheim>
NODE_ENV=production
```

Danach **Redeploy** des Control-Center-Services.

---

## 8. Tests

| Test | Ergebnis |
|------|----------|
| `npm run build` | OK |
| Proxy-Routen registriert | OK |
| Fehlende ENV → klare Meldung | OK |
| Demo-Fallback bei API-Ausfall | OK |

---

## 9. Wichtig: Änderung in der Haupt-App nötig

**Folgende Änderung wäre in der RabbitStation Haupt-App nötig:**

Die Admin-API (`/api/admin/*`) akzeptiert aktuell nur ein **JWT** von einem eingeloggten Plattform-Admin (`requirePlatformAdmin` + `adminApiGate`), **nicht** ein festes Server-zu-Server-Token.

**Empfehlung für die Haupt-App:**

- Middleware z. B. `requirePlatformAdminOrServiceToken`, die prüft:
  - `Authorization: Bearer <JWT>` mit Rolle `saas_owner` / `saas_superadmin`, **oder**
  - `Authorization: Bearer <CONTROL_CENTER_API_TOKEN>` wenn Token mit `process.env.CONTROL_CENTER_API_TOKEN` (Haupt-App) übereinstimmt.

**Workaround bis dahin:**

1. In der Haupt-App als `saas_owner` anmelden (Demo: `admin` / Demo-Passwort).
2. JWT aus Browser-Speicher kopieren (`rabbit_technik_admin_token` in localStorage).
3. Als `CONTROL_CENTER_API_TOKEN` in Railway eintragen (läuft nach JWT-Ablauf ab).

---

## 10. Mapping-Hinweise

Die Haupt-App liefert teils schlankere JSON-Strukturen als die ursprüngliche Demo-UI. Das Control Center mappt:

- Tenants: `companyName` → Name, `subscriptionStatus` → Status, `userCount` → Mitarbeiter
- Logs: `tenant_audit_logs` → Severity aus `action`
- Health: Basis aus `/health` + Backups aus `/backups/status`; Mail/Zahlungen/Speicher/Uptime oft „Unbekannt“, bis die Haupt-App erweitert wird
