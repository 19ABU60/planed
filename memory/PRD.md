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

## Recherche-Funktion (NEU - 12.01.2026)
- **Bilder-Tab:** Suche über Wikimedia Commons API (kostenlos)
  - `ImageWithFallback`-Komponente für robuste Anzeige
  - Download und Ansehen von Bildern
  - Fallback-Links zu Pixabay, Unsplash wenn keine Ergebnisse
- **Videos-Tab:** Links zu YouTube-Suche mit Bildungskanal-Empfehlungen
- **Fachtexte-Tab:** OpenAlex-Suche mit KI-Übersetzung (Gemini)

## Implementierte Features ✅

### Arbeitsplan-Tabelle (NEU - 12.01.2026)
- Excel-ähnliche Tabelle für kollaborative Unterrichtsplanung
- Spalten: Datum, Tag, Stunde, Unterrichtseinheit, Lehrplan/Standards, Stundenthema/Zielsetzung
- Automatische Generierung basierend auf Stundenplan
- Monatsnavigation
- Speichern/Laden von Einträgen

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
- `/api/workplan/{class_id}` - GET (mit start/end Query-Params)
- `/api/workplan/{class_id}/bulk` - POST (Speichern mehrerer Einträge)

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

### 20.01.2026 - Backend Refactoring: Modulare Struktur ✅
- **Problem:** server.py hatte 3083 Zeilen - schwer wartbar und erweiterbar
- **Lösung:** Modulare Struktur eingeführt
- **Neue Struktur:**
  ```
  /app/backend/
  ├── server.py              ← 2355 Zeilen (vorher 3083)
  ├── data/
  │   ├── lehrplan_deutsch_rlp.py   ← 294 Zeilen (Lehrplan)
  │   └── schulbuecher_deutsch.py   ← 438 Zeilen (31 Schulbücher)
  ├── models/
  │   └── schemas.py         ← Alle Pydantic Models
  ├── services/
  │   └── auth.py            ← Auth-Helfer, DB-Zugriff
  └── routes/
      └── auth.py            ← (vorbereitet für spätere Auslagerung)
  ```
- **Vorteile:**
  - Neue Fächer können als eigene Dateien hinzugefügt werden (z.B. `data/lehrplan_mathe_rlp.py`)
  - Schulbücher sind separat und leicht erweiterbar
  - Keine Änderung an Haupt-server.py nötig für neue Fach-Daten
- **Test-Status:** ✅ Server startet, alle APIs funktionieren
- **Reduzierung:** 728 Zeilen aus server.py ausgelagert

### 20.01.2026 - Alternative Unterrichtsreihen mit verschiedenen Schulbüchern ✅
- **Neues Feature:** Vergleich mehrerer Unterrichtsreihen mit verschiedenen Schulbüchern
- **Funktionsweise:**
  - Nach der Generierung erscheinen "Versionen"-Tabs 
  - "+" Alternative Button öffnet Modal zur Schulbuch-Auswahl
  - Max. 4 Alternativen möglich (temporär gespeichert)
  - Wechsel zwischen Versionen per Klick auf Tab
  - Jede Version wird automatisch in der Datenbank gespeichert
  - "X" zum Löschen nicht benötigter Alternativen
- **UI-Elemente:**
  - Violett hervorgehobene aktive Version
  - Modal mit allen verfügbaren Schulbüchern (bereits genutzte ausgeblendet)
  - Loading-Indikator während Generierung
- **Test-Status:** ✅ Frontend getestet - Versionen-Tabs und Modal funktionieren
- **Dateien geändert:** `/app/frontend/src/pages/CurriculumPlannerPage.js`

### 20.01.2026 - Schulbuch-Integration für KI-Unterrichtsreihen ✅
- **Neues Feature:** Schulbuch-Dropdown bei der Unterrichtsreihen-Generierung
- **31 Schulbücher integriert:**
  | Verlag | Reihe | Klassenstufen |
  |--------|-------|---------------|
  | Westermann | Praxis Sprache | 5-10 |
  | Schroedel | Wortstark | 5-10 |
  | Schöningh | P.A.U.L. D. | 5-10 |
  | Klett | Deutsch kompetent | 5-10 |
  | Cornelsen | Deutschbuch | 5-10 |
- **Funktionsweise:**
  - KI generiert Unterrichtsreihen mit konkreten Seitenverweisen (z.B. "S. 52-53, Aufgabe 1-3")
  - Schulbuch-Kapitel werden automatisch basierend auf Kompetenzbereich vorgeschlagen
  - Jede Stunde enthält `schulbuch_seiten`-Feld mit Verweisen
- **Neue API-Endpunkte:**
  - `GET /api/lehrplan/schulbuecher` - Liste aller Schulbücher (filterbar nach Klassenstufe)
  - `POST /api/lehrplan/unterrichtsreihe/generieren` - Erweitertes Feld `schulbuch_id`
- **UI-Änderungen:**
  - Neues Dropdown "Schulbuch:" neben der Stundenanzahl
  - Violettes Info-Banner wenn Schulbuch gewählt
  - Schulbuch-Badge bei generierter Reihe
  - Seitenzahlen-Anzeige bei jeder Stunde (violett hervorgehoben)
- **Test-Status:** ✅ Backend getestet - Seitenangaben werden korrekt generiert
- **Dateien geändert:**
  - `/app/backend/server.py` - Schulbuch-Daten, neuer Endpunkt, erweiterter Prompt
  - `/app/frontend/src/pages/CurriculumPlannerPage.js` - Schulbuch-Dropdown und Anzeige

### 14.01.2026 - Unterrichtsreihen-Übertragung zu Arbeitsplan BUGFIX ✅
- **Problem:** Generierte Unterrichtsreihen wurden in Arbeitsplan übertragen, aber nicht angezeigt
- **Ursache:** Hardcodiertes `period: 1` in `handleSubmit` - Einträge wurden immer für die 1. Stunde erstellt, obwohl Klassen zu anderen Zeiten Unterricht haben
- **Lösung:** Neue `getScheduledSlots()`-Funktion in `CurriculumPlannerPage.js`:
  - Iteriert durch alle Tage ab Startdatum
  - Sammelt Unterrichtsstunden gemäß dem Klassenplan (schedule)
  - Weist jeder Unterrichtsstunde das korrekte Datum und die korrekte Periode zu
- **Beispiel:** Klasse 6a-Deutsch mit Schedule `monday: [2,3], wednesday: [3], thursday: [4], friday: [2]` → Einträge erscheinen jetzt in Periode 2, 3, 4 statt alle in Periode 1
- **Test-Status:** ✅ 100% bestanden - Einträge werden korrekt in der Arbeitsplan-Tabelle angezeigt
- **Datei geändert:** `/app/frontend/src/pages/CurriculumPlannerPage.js` (Zeilen 86-160)

### 13.01.2026 - Bildersuche komplett überarbeitet
- **Bug behoben:** Bilder zeigten nur ? Platzhalter, Download stürzte ab
- **Lösung:** Wikimedia Commons API (kostenlos, kein API-Key)
- **UI:** Suchfelder kompakter für iPad-Nutzung (140px breit, 28px hoch)
- **Unsplash-Fix:** URL-Format korrigiert (Bindestriche statt +)

**Zukünftige Feature-Ideen (vom Benutzer):**
- Lernprogramme für SuS finden (Anton, Kahoot, LearningApps etc.)
- Arbeitsblätter mit KI entwickeln
- Quiz-Generator für Lernstandskontrollen

### 13.01.2026 - Bildersuche-Bug behoben (ursprünglich)
- **Problem:** Bildersuche auf "Recherche"-Seite zeigte nur ? Platzhalter, Download stürzte ab
- **Ursache:** Pixabay API benötigt API-Key, fehlende User-Agent Header bei Wikimedia
- **Lösung:** 
  - Backend auf Wikimedia Commons API umgestellt (kostenlos, kein API-Key)
  - User-Agent Header hinzugefügt (erforderlich für Wikimedia)
  - Frontend: `ImageWithFallback`-Komponente für bessere Fehlerbehandlung
- **Neue Endpunkte:** `GET /api/research/images` (jetzt mit Wikimedia Commons)
- **Test-Status:** ✅ Alle Tests bestanden (15 Bilder, Download funktioniert)

### 12.01.2026 - Arbeitsplan-Tabelle Spaltenanpassung
- Spaltenbreiten anpassbar mit **−** und **+** Buttons
- Neue Standardbreiten:
  - "Unterrichtseinheit" - schmal (120px)
  - "Lehrplan, Standards, Hinweise" - schmal (120px)
  - "Stundenthema, Zielsetzung, Lernziele" - groß (450px)
- "Lernziele" zur dritten Spalte hinzugefügt
- "↺ Reset" Button zum Zurücksetzen der Spaltenbreiten
- Spaltenbreiten werden im Browser gespeichert

### 12.01.2026 - Kalender-Farbfehler behoben & Spalten-Resize
- **Kalender**: Lektionen zeigen jetzt die korrekte Klassenfarbe an
- **Arbeitsplan-Tabelle**: Spaltenbreiten können durch Ziehen angepasst werden
  - "Unterrichtseinheit", "Lehrplan...", "Stundenthema..." sind resizable
  - Spaltenbreiten werden im localStorage gespeichert
  - Zurücksetzen-Button zum Wiederherstellen der Standardbreiten
  - Hinweis für Benutzer über die Resize-Funktion

### 12.01.2026 - Arbeitsplan-Tabelle fertiggestellt
- Neue Excel-ähnliche Arbeitsplan-Tabelle implementiert
- Schmale Spalten: "Datum", "Tag", "Std." (Stunde)
- Drei statische Inhaltsspalten:
  - "Unterrichtseinheit"
  - "Lehrplan, Bildungsstandards, Begriffe, Hinweise"
  - "Stundenthema, Zielsetzung"
- Backend-API für Speichern/Laden angepasst (`/api/workplan/{class_id}`)
- Daten werden pro Klasse und Datum/Stunde persistent gespeichert
- Header in Klassenfarbe
- API: `GET/POST /api/workplan/{class_id}/bulk`

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
