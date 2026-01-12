# PlanEd - Lehrer-Arbeitsplan-App

## Überblick
PlanEd ist eine Web-Anwendung für Lehrer zur Verwaltung von Arbeitsplänen, die Excel-basierte Lösungen ersetzt.

## Technologie-Stack
- **Backend:** FastAPI (Python), MongoDB
- **Frontend:** React, Axios, Recharts, date-fns
- **Auth:** JWT-basierte Authentifizierung

## Architektur (nach Refactoring - 12.01.2026)

### Frontend-Struktur
```
/app/frontend/src/
├── App.js (245 Zeilen - Hauptrouting)
├── App.css
├── context/
│   └── AuthContext.js
├── components/
│   ├── Sidebar.js
│   ├── NotificationBell.js
│   └── GlobalSearch.js
└── pages/
    ├── LoginPage.js
    ├── DashboardPage.js
    ├── CalendarPage.js
    ├── StatisticsPage.js
    ├── ClassesPage.js
    ├── TemplatesPage.js
    ├── TodosPage.js
    ├── SharingPage.js
    ├── DocumentsPage.js
    ├── HistoryPage.js
    └── SettingsPage.js
```

### Backend-Struktur
```
/app/backend/
└── server.py (Alle API-Endpunkte)
```

## Implementierte Features ✅

### Authentifizierung
- Registrierung mit E-Mail/Passwort
- JWT-basierte Login
- Profil-Einstellungen

### Schuljahre & Klassen
- CRUD für Schuljahre (Name, Semester, Datum)
- CRUD für Klassen/Fächer (Name, Fach, Farbe, Wochenstunden)

### Kalender & Unterrichtsstunden
- Monats- und Wochenansicht
- CRUD für Unterrichtsstunden
- Drag & Drop zum Verschieben
- Stunden kopieren
- KI-Vorschläge für Themen (Gemini)

### Deutsche Schulferien
- Automatische Integration nach Bundesland
- **Standard: Rheinland-Pfalz**
- Unterstützte Bundesländer: Bayern, NRW, Berlin, Baden-Württemberg, Hessen, Sachsen, Niedersachsen, Hamburg, Rheinland-Pfalz
- Gesetzliche Feiertage

### Statistiken
- Verfügbare/geplante/verbleibende Stunden
- Diagramme (Bar, Pie)
- Fortschrittsanzeige
- Export: Excel, Word, PDF

### Vorlagen
- Speichern wiederverwendbarer Unterrichtsvorlagen
- Verwendungszähler

### Aufgaben (Todos)
- CRUD für Aufgaben
- Priorität (Hoch/Mittel/Niedrig)
- Fälligkeitsdatum
- Klassen-Zuordnung

### Freigaben
- Arbeitspläne mit Kollegen teilen
- Berechtigungen (Ansicht/Bearbeiten)
- Benachrichtigungen bei Änderungen

### Dokumente
- Upload (DOCX, PDF, JPG, PNG)
- Klassenzuordnung
- Download/Löschen

### Verlauf
- Aktivitätsprotokoll aller Änderungen

### Globale Suche
- Durchsuchen von Stunden, Klassen, Vorlagen, Aufgaben

## API-Endpunkte

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/settings`

### Schulferien
- `GET /api/holidays/bundeslaender`
- `GET /api/holidays/school-holidays/{bundesland}`
- `GET /api/holidays/public-holidays`

### CRUD-Endpunkte
- `/api/school-years`
- `/api/classes`
- `/api/lessons`
- `/api/templates`
- `/api/todos`
- `/api/holidays`
- `/api/documents`
- `/api/shares`
- `/api/notifications`
- `/api/history`
- `/api/statistics/{class_id}`
- `/api/search`

### Export
- `GET /api/export/excel/{class_id}`
- `GET /api/export/word/{class_id}`
- `GET /api/export/pdf/{class_id}`

### KI
- `POST /api/ai/suggestions`

## Test-Status (12.01.2026)
- ✅ 38/38 Backend-Tests bestanden (100%)
- ✅ Alle 11 Frontend-Seiten funktionieren
- ✅ Deutsche Lokalisierung komplett
- ✅ Rheinland-Pfalz als Standard-Bundesland

## Anstehende Features (Backlog)

### Phase 1 (Hohe Priorität)
- [ ] Excel-Import bestehender Arbeitspläne
- [ ] Kommentare für geteilte Pläne

### Phase 2 (Mittlere Priorität)
- [ ] PWA / Mobile-Optimierung
- [ ] E-Mail-Benachrichtigungen
- [ ] Materialien mit Lektionen verknüpfen

### Phase 3 (Niedrige Priorität)
- [ ] Lehrplan-Datenbank
- [ ] Fachschafts-Räume
- [ ] KI-generierte Arbeitsblätter

## Changelog

### 12.01.2026 - Einladungs-Code & Handout
- Einladungs-Code-System implementiert (Standard: LASP2026)
- Registrierung nur mit gültigem Code möglich
- Handout/Kurzanleitung erstellt (HTML, druckbar als PDF)
- Verfügbar unter: /handout.html

### 12.01.2026 - PWA-Implementierung
- Progressive Web App (PWA) hinzugefügt
- App kann auf Mac, iPad, iPhone, Windows installiert werden
- Service Worker für Offline-Unterstützung
- App-Icons für alle Plattformen generiert
- manifest.json mit deutschen Metadaten
- Install-Banner für einfache Installation

### 12.01.2026 - Großes Refactoring
- App.js von 1750 auf 245 Zeilen reduziert
- Komponenten in separate Dateien aufgeteilt
- Rheinland-Pfalz als Standard-Bundesland hinzugefügt
- react-joyride entfernt (Kompatibilitätsprobleme)
- 38 Backend-Tests hinzugefügt

### Vorherige Implementierung
- Vollständiges MVP mit allen Kernfunktionen
- Drag & Drop für Kalender
- Freigabe-System mit Benachrichtigungen
- Export-Funktionen (Excel, Word, PDF)
- KI-Vorschläge mit Gemini
