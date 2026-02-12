# PlanEd - Lehrer-Planungsanwendung

## Übersicht
PlanEd ist eine umfassende Lehrerplanungs-App, die Excel-basierte Systeme durch eine digitale Lösung für Arbeitspläne, Fächer, Klassen und Ferien ersetzt. Die App enthält KI-gestützte Unterrichtsplanung mit OpenAI.

## Status: ✅ PRODUKTIV AUF HOSTINGER
- **URL:** `http://187.77.64.225:3000`
- **Hosting:** Hostinger VPS mit Docker/Coolify
- **KI:** OpenAI API (gpt-4o-mini)

## Technologie-Stack
- **Frontend:** React, Nginx (Docker)
- **Backend:** FastAPI, Python 3.11 (Docker)
- **Datenbank:** MongoDB (Docker)
- **KI:** OpenAI API
- **Deployment:** Docker Compose, Coolify

## Erledigte Aufgaben (Stand: 12.02.2026)

### ✅ Hostinger Deployment (P0) - GELÖST
- API-Key wird direkt aus `/app/config/.env` gelesen
- Frontend verwendet relative URLs (`/api/...`)
- Nginx proxied zum Backend
- Robustes `start.sh` Startup-Skript

### ✅ Profil-Einstellungen - GELÖST
- Name kann jetzt in Einstellungen geändert werden
- Bundesland-Auswahl funktioniert

### ✅ KI-Unterrichtsplanung
- Deutsch und Mathe Fächer
- Unterrichtsreihen-Generierung
- Material-Generierung (Arbeitsblätter, Quiz, etc.)
- DOCX-Export

### ✅ Kern-Features
- Benutzer-Authentifizierung (JWT)
- Arbeitspläne verwalten
- Kalender mit Ferien
- Excel-Import/Export
- Klassen und Fächer verwalten

## Wichtige Dateien für Deployment
- `/app/backend/services/openai_helper.py` - Liest API-Key aus Datei
- `/app/backend/start.sh` - Startup-Skript
- `/app/docker-compose.yml` - Docker-Konfiguration
- `/app/backend/Dockerfile` - Backend-Container
- `/app/frontend/Dockerfile` - Frontend-Container

## API-Key Einrichtung auf Hostinger
```bash
# Im Backend-Terminal:
echo "OPENAI_API_KEY=sk-..." > /app/config/.env
# Container neu starten
```

## Zugangsdaten
- **Einladungscode:** LASP2026
- **Test-Account:** abusse@gmx.net

## Kommende Aufgaben

### P1 - Text-to-Speech (TTS)
- "Vorlesen" Feature für generierte Materialien

### P2 - Zukünftige Features
- PWA Auto-Update Benachrichtigung
- Custom Domain verbinden
- Kommentarfunktion für geteilte Arbeitspläne
- Statistik-Seite verbessern
- E-Mail-Benachrichtigungen

## Bekannte Hinweise
- Safari-Benutzer: Bei Problemen Hard-Refresh (Cmd+Shift+R)
- API-Key muss nach jedem Container-Neustart geprüft werden (persistentes Volume)
