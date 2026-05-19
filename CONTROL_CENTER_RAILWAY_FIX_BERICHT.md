# Control Center: Railway „Cannot GET /“ – Fix-Bericht

**Datum:** 2026-05-19  
**Repo:** RabbitStation Control Center (`Projekt Verkauf WEBAPP`)

## Ursache

Auf Railway trat „Cannot GET /“ auf, wenn:

1. **Falscher Static-Pfad** (ältere Revision): `../dist/client` relativ zu `dist/server/` zeigt auf `dist/dist/client` statt `dist/client`.
2. **Fehlender Frontend-Build**: Wenn `npm ci` ohne Dev-Dependencies läuft, schlägt `vite build` fehl → `dist/client/index.html` fehlt im Container.

Der aktuelle Code nutzte bereits `resolveClientDist()` → `../client` (= `dist/client`). Der Fehler in Produktion kam sehr wahrscheinlich von einer **alten Deployment-Revision** oder einem **fehlgeschlagenen Build**.

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `server/index.ts` | `GET /health`, explizites `GET /`, SPA-Fallback gehärtet, JSON-404 für unbekannte `/api/*`-Pfade |
| `railway.toml` | `buildCommand = "npm run build"` (kein zweites `npm ci`) |
| `railpack.json` | Install: `package.json` + `package-lock.json` kopieren, dann `npm ci --include=dev` |
| `.env.example` | Hinweis auf Deploy-Checks für `/` und `/health` |

## Routen nach Deploy

| URL | Erwartung |
|-----|-----------|
| `/` | React SPA (`index.html`) |
| `/health` | `{ "status": "ok", "service": "RabbitStation Control Center" }` |
| `/api/health` | Bestehend (Railway Healthcheck in `railway.toml`) |
| Unbekannte `/api/...` | `404` JSON `{ ok: false, error: "Not found", path: "..." }` |

## Build & Start

```bash
npm run build          # tsc + vite → dist/client
npm start              # node dist/server/index.js
```

Railway Build (zwei Schritte, kein doppeltes `npm ci` im Build):

```bash
# Install (railpack.json)
npm ci --include=dev
# Build (railway.toml)
npm run build
```

**Hinweis:** Ein zweites `npm ci` im `buildCommand` führte zu `EBUSY: rmdir node_modules/.vite` (Railpack-Cache). Nur einmal installieren.

## Lokale Verifikation

```bash
npm run build
$env:PORT=4015; node dist/server/index.js
```

Ergebnis:

- `GET http://127.0.0.1:4015/health` → JSON OK
- `GET http://127.0.0.1:4015/` → HTTP 200 (HTML)
- `GET http://127.0.0.1:4015/api/unknown-route-test` → 404 JSON
- Startup-Log: `[startup] Frontend: .../dist/client`

## Railway-Checkliste (manuell)

1. Neues Deployment nach Push auslösen (Redeploy).
2. Build-Logs: `npm ci --include=dev && npm run build` erfolgreich, kein Vite/tsc-Fehler.
3. Runtime-Log: `[startup] Frontend: .../dist/client` (nicht „Frontend fehlt“).
4. Browser: `https://rabbitstationcontrollcenter-production.up.railway.app/` → App lädt.
5. `GET /health` → JSON.
6. ENV: `SESSION_SECRET`, optional `RABBITSTATION_API_URL`, `CONTROL_CENTER_API_TOKEN`.

## Nicht geändert

- RabbitStation Haupt-App
- API-Proxy `/api/control-center/*`
