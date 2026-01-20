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

### Phase 1 (Hohe Priorität - Fertig) ✅
- [x] Excel-Import für bestehende Arbeitspläne
- [x] Excel-Import mit Vorschau-Funktion
- [x] Fach-Auswahl (Deutsch/Mathematik) in Unterrichtsplanung
- [x] Mathe-Schulbücher mit Kapitelstrukturen (24 Bücher)
- [x] Auth-Routes ausgelagert
- [x] Lessons/Workplan-Routes ausgelagert
- [x] Templates/Todos-Routes ausgelagert

### Phase 1.5 (Backend-Refactoring - Fortsetzung)
- [ ] Weitere Routes auslagern (Holidays, Comments, Statistics, Research)
- [ ] Ziel: server.py unter 1500 Zeilen

### Phase 2 (Mittlere Priorität)
- [ ] PWA Auto-Update-Benachrichtigung (Safari-Caching-Problem)
- [ ] E-Mail-Benachrichtigungen
- [ ] Materialien mit Lektionen verknüpfen
- [ ] Kommentare für geteilte Pläne

### Phase 3 (Niedrige Priorität)
- [ ] Fachschafts-Räume
- [ ] KI-generierte Arbeitsblätter
- [ ] Excel-Import Vorschau-Funktion

## Changelog

### 20.01.2026 - Backend-Refactoring Phase 3 - Ziel erreicht! ✅
- **server.py reduziert auf 1378 Zeilen** (von ursprünglich 2162 - Ziel war unter 1500)
- **Neue Module erstellt:**
  - `routes/statistics.py` - Statistik-Endpunkte (~150 Zeilen)
  - `routes/sharing.py` - Sharing & Notification-Endpunkte (~170 Zeilen)
  - `routes/research.py` - Research API (Images, Videos, Papers, Translate) (~280 Zeilen)
- **Verbleibende Endpunkte in server.py:** 30 (von 45)
- **Modulare Backend-Architektur abgeschlossen:**
  - `/routes/auth.py` - Authentifizierung
  - `/routes/lessons.py` - Stunden & Arbeitsplan
  - `/routes/templates_todos.py` - Vorlagen & Aufgaben
  - `/routes/statistics.py` - Statistiken
  - `/routes/sharing.py` - Freigaben & Benachrichtigungen
  - `/routes/research.py` - Recherche-API
  - `/routes/faecher/deutsch.py` - Deutsch-Unterrichtsplanung
  - `/routes/faecher/mathe.py` - Mathematik-Unterrichtsplanung

### 20.01.2026 - Excel-Import Vorschau + Backend-Refactoring Phase 2 ✅
- **Excel-Import mit Vorschau-Funktion:**
  - Neuer `/api/import/excel/preview` Endpoint
  - Modal zeigt: Erkannte Spalten, Gesamtzeilen, gültige Zeilen
  - Datenvorschau (erste 10 Zeilen) vor dem Import
  - Benutzer kann Import bestätigen oder abbrechen
  - Farb-Codierung für erkannte vs. unbekannte Spalten
  
- **Backend-Refactoring Phase 2:**
  - Lessons/Workplan Routes → `/routes/lessons.py` (neu)
  - Templates/Todos Routes → `/routes/templates_todos.py` (neu)
  - server.py reduziert auf ~1927 Zeilen (von 2162)
  - Alle ausgelagerten Endpunkte getestet und funktionsfähig

### 20.01.2026 - Mathe-Schulbücher erweitert + Excel-Import Frontend + Auth-Refactoring ✅
- **Mathe-Schulbücher massiv erweitert (24 Bücher):**
  - Cornelsen - Mathe Live 5-10 (komplette Reihe mit detaillierten Kapitelstrukturen)
  - Schroedel - Mathematik Neue Wege 5-10 (neue Reihe hinzugefügt)
  - Alle Bücher mit echten Seitenangaben und Themenübersichten
  
- **Excel-Import Frontend implementiert:**
  - Neuer "Excel Import" Button in der Arbeitsplan-Tabelle
  - Datei-Upload (.xlsx, .xls) mit FormData
  - Automatisches Neuladen der Daten nach Import
  - Loading-Spinner während des Imports
  - Datei: `/app/frontend/src/pages/WorkplanTablePage.js`
  
- **Backend-Refactoring: Auth-Routes ausgelagert:**
  - Auth-Endpunkte aus server.py entfernt (62 Zeilen)
  - `routes/auth.py` wird jetzt aktiv verwendet
  - server.py reduziert auf 2100 Zeilen (von 2162)

### 20.01.2026 - Frontend Fach-Auswahl (Deutsch/Mathematik) ✅
- **Neues Feature:** Fach-Dropdown in der Unterrichtsplanung
- **UI-Änderungen:**
  - Neues "Fach" Dropdown am Anfang der Auswahl-Leiste
  - 🇩🇪 Deutsch (blauer Hintergrund) und 📐 Mathematik (grüner Hintergrund)
  - Header zeigt aktuell gewähltes Fach an ("Mathematik RS+ • Rheinland-Pfalz • Lehrplanbasiert")
- **Funktionalität:**
  - Wechsel zwischen Fächern lädt automatisch den entsprechenden Lehrplan
  - Klassenstufen, Kompetenzbereiche, Themen werden fachspezifisch geladen
  - Schulbücher werden passend zum Fach und zur Klassenstufe angezeigt
  - Generierung verwendet den korrekten API-Pfad (`/api/lehrplan/...` vs `/api/mathe/...`)
- **Datei geändert:** `/app/frontend/src/pages/CurriculumPlannerPage.js`
  - `selectedFach` State (Zeile 299)
  - Dynamische API-Pfade für Struktur, Schulbücher, Generierung
  - Fach-Dropdown mit data-testid="fach-select"
- **Test-Status:** ✅ Frontend getestet - Fach-Wechsel und Datenladung funktionieren

### 20.01.2026 - P1 & P2: Mathe-Fach + Excel-Import + Restliche Routes ✅
- **P1.1 Mathe-Fach hinzugefügt:**
  - `data/lehrplan_mathe_rlp.py` - Lehrplan Klassen 5-10 (302 Zeilen)
  - `data/schulbuecher_mathe.py` - 15 Schulbücher (Sekundo, Schnittpunkt, Mathe Live)
  - `routes/faecher/mathe.py` - Komplettes Modul (287 Zeilen)
  - API: `/api/mathe/struktur`, `/api/mathe/schulbuecher`, `/api/mathe/unterrichtsreihe/generieren`
  
- **P1.2 Excel-Import:**
  - Neuer Endpunkt: `POST /api/import/excel/{class_subject_id}`
  - Erkennt automatisch Spalten: Datum, Stundenthema, Ziel, Lehrplan, Begriffe, UE, Ausfall
  - Unterstützt Formate: DD.MM.YYYY, DD.MM.YY, YYYY-MM-DD
  - Aktualisiert existierende Einträge oder erstellt neue

- **P2 Restliche Routes ausgelagert:**
  - `routes/school_years.py` - Schuljahre (61 Zeilen)
  - `routes/workplan.py` - Arbeitsplan (138 Zeilen)
  - `routes/classes.py` - Klassen (63 Zeilen)
  - `routes/auth.py` - Authentifizierung (83 Zeilen)

- **Finale Struktur:**
  ```
  /app/backend/
  ├── server.py                 ← 2162 Zeilen (von ursprünglich 3083)
  ├── data/
  │   ├── lehrplan_deutsch_rlp.py   (294 Zeilen)
  │   ├── lehrplan_mathe_rlp.py     (302 Zeilen) ← NEU
  │   ├── schulbuecher_deutsch.py   (438 Zeilen)
  │   └── schulbuecher_mathe.py     (212 Zeilen) ← NEU
  ├── routes/
  │   ├── auth.py, classes.py, school_years.py, workplan.py
  │   └── faecher/
  │       ├── deutsch.py (415 Zeilen)
  │       └── mathe.py   (287 Zeilen) ← NEU
  ├── models/schemas.py
  └── services/auth.py
  ```
- **Test-Status:** ✅ Server läuft, alle APIs funktionieren

### 20.01.2026 - Backend Refactoring: Routes ausgelagert ✅
- **Weiterführung des Refactorings:** Deutsch-Fach-Modul komplett ausgelagert
- **Neue Struktur:**
  ```
  /app/backend/
  ├── server.py                 ← 2002 Zeilen (vorher 3083)
  ├── data/
  │   ├── lehrplan_deutsch_rlp.py   ← 294 Zeilen
  │   └── schulbuecher_deutsch.py   ← 438 Zeilen
  ├── models/
  │   └── schemas.py            ← Alle Pydantic Models
  ├── services/
  │   └── auth.py               ← Auth-Helfer, DB-Zugriff
  └── routes/
      ├── auth.py               ← (vorbereitet)
      ├── classes.py            ← (vorbereitet)
      └── faecher/
          └── deutsch.py        ← 415 Zeilen (Unterrichtsplanung)
  ```
- **API-Version:** v2.1.0 - Modular
- **Vorteile für neue Fächer:**
  - Neues Fach = Neue Datei in `routes/faecher/` + Daten in `data/`
  - Deutsch-Modul als Vorlage für Mathe, Englisch etc.
- **Reduzierung:** 1081 Zeilen aus server.py ausgelagert (von 3083 auf 2002)
- **Test-Status:** ✅ Server startet, alle APIs funktionieren

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
