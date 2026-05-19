# Control Center — Leere Seite behoben

**Datum:** 2026-05-19  
**Projekt:** RabbitStation Control Center  
**Haupt-App:** nicht geändert

---

## 1. Warum die Seite leer war

**Hauptursache:** In `ControlCenterPage.tsx` wurde `logsEmpty` verwendet, aber **nie definiert** → `ReferenceError: logsEmpty is not defined` beim Rendern → React bricht ab → nur dunkler Hintergrund, keine Sidebar/Karten.

**Zusätzlich:** Fehlende API-Daten (`health`, `tenants`, …) konnten bei Live-Daten zu weiteren Laufzeitfehlern führen, wenn Felder `undefined` waren.

---

## 2. Gecrashte Komponente

- **`ControlCenterPage`** (Render-Phase wegen `logsEmpty`)
- Potenziell **`SystemStatusCards`** bei unvollständigem `health`-Objekt

---

## 3. Eingebaute Fallbacks

| Bereich | Leer-/Fehlerzustand |
|---------|---------------------|
| Tenants | „Keine Tenants gefunden“ / „konnten nicht geladen werden“ |
| Logs | „Keine aktuellen Systemmeldungen“ / „konnten nicht geladen werden“ |
| Abos | 0 / „Noch keine Abo-Daten verfügbar“ |
| Backups | „Backup-System nicht konfiguriert“ |
| Health | „Nicht verfügbar“ / Status `unknown` |
| Security | „Keine Sicherheitsdaten verfügbar“ |
| Charts | „Keine Diagrammdaten verfügbar“ |

Zentral: `src/data/controlCenterDefaults.ts` + `normalizeOverviewData()`.

---

## 4. ErrorBoundary

- `src/components/ErrorBoundary.tsx`
- Um `ControlCenterPage` in `App.tsx` (Fullscreen-Fallback)
- Zusätzlich **kompakt** um den Hauptinhalt (Sidebar/Header bleiben sichtbar)

---

## 5. Konfigurationsfehler

`DataSourceBanner` zeigt:

- Titel: Konfiguration unvollständig / Haupt-App nicht verbunden
- `RABBITSTATION_API_URL`: gesetzt/fehlt
- `CONTROL_CENTER_API_TOKEN`: gesetzt/fehlt
- Letzter Fehler (ohne Token-Wert)
- Button: **Erneut prüfen**

API-Client (`requestSafe`) liefert strukturierte Fehler (`invalid_json`, `network_error`, …) ohne ungefangene Exceptions beim Laden.

---

## 6. Demo-Daten

Demo-Daten bleiben **entfernt**. Keine Fake-Tenants, kein Demo-Modus.

---

## 7. Tests

| Test | Ergebnis |
|------|----------|
| `npm run test` (Defaults-Normalisierung) | ✅ |
| `npm run build` | ✅ |
| Railway Deploy | ⏳ nach Push |
| Manuell ENV/API-Szenarien | Checkliste unten |

**Manuelle Checkliste nach Deploy:**

1. Ohne `RABBITSTATION_API_URL` → Seite + Konfigurationsbanner
2. Ohne `CONTROL_CENTER_API_TOKEN` → Seite + Token fehlt
3. Haupt-App offline → „Haupt-App nicht verbunden“
4. Ungültiges JSON → Fehlermeldung, keine leere Seite
5. Leere Tenants → Tabelle mit Hinweis
6. Keine Demo-Daten sichtbar

---

## Geänderte Dateien (Auswahl)

- `src/pages/ControlCenterPage.tsx`
- `src/api/client.ts`
- `src/data/controlCenterDefaults.ts`
- `src/components/ErrorBoundary.tsx`
- `src/components/control-center/*` (Absicherung)
- `src/App.tsx`
