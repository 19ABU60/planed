# PlanEd - Lehrer-Arbeitsplan-App

## Original Problem Statement
Erstelle eine App für Lehrer zur Erstellung und Verwaltung von Arbeitsplänen für verschiedene Klassen und Fächer (z.B. Kl. 6a - Deutsch). Die App basiert auf einer Excel-Vorlage mit Kalenderstruktur, Unterrichtsplanung (Stundenthema, Zielsetzung, Lehrplan, Bildungsstandards) und Stundenstatistik pro Wochentag.

## User Personas
- **Primär**: Lehrer und Pädagogen an deutschen Schulen
- **Use Case**: Jahresplanung und Dokumentation von Unterrichtsstunden

## Core Requirements (Static)
1. ✅ Kalenderansicht mit Unterrichtsplanung
2. ✅ Statistik-Dashboard (verfügbare/genutzte Stunden)
3. ✅ Verwaltung mehrerer Klassen und Fächer
4. ✅ Markierung von Unterrichtsausfall
5. ✅ Export-Funktion (PDF/Excel/Word)
6. ✅ Verwaltung mehrerer Schuljahre
7. ✅ Dokumenten-Upload für Unterrichtsvorbereitungen
8. ✅ Benutzeranmeldung (JWT Auth)
9. ✅ Dunkles, professionelles Design
10. ✅ Optional: KI-Vorschläge für Unterrichtsthemen (Gemini)

## Architecture
- **Backend**: FastAPI + MongoDB
- **Frontend**: React mit Dark Theme (Custom CSS)
- **Auth**: JWT-basierte Authentifizierung
- **AI**: Gemini 3 Flash via Emergent LLM Key

## What's Been Implemented (December 2024)

### Backend (server.py)
- User Authentication (Register/Login/JWT)
- School Years CRUD
- Classes/Subjects CRUD
- Lessons CRUD with full metadata
- Holidays Management
- Statistics Calculation
- Export Endpoints (Excel, Word, PDF)
- Document Upload/Download
- AI Topic Suggestions (Gemini Integration)

### Frontend (App.js)
- Login/Registration Page with dark theme
- Dashboard with Bento Grid layout
- Calendar View (monthly, with lesson items)
- Statistics Page with charts and export buttons
- Classes Management Page
- Documents Page with upload
- Settings Page
- Sidebar Navigation

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- ✅ Core CRUD operations
- ✅ Calendar view
- ✅ Authentication

### P1 (Important) - Next Phase
- Drag & Drop für Unterrichtsstunden im Kalender
- Ferienverwaltung mit deutschem Ferienkalender
- Batch-Erstellung von Unterrichtsstunden

### P2 (Nice to Have)
- Kollegiumsfreigabe (Arbeitspläne teilen)
- Vorlagen für häufige Lehrplanpunkte
- Offline-Modus (PWA)
- Mobile Optimierung

## Next Action Items
1. Drag & Drop für Kalendereinträge implementieren
2. Deutsche Feiertage/Ferien automatisch laden
3. Batch-Import aus Excel
4. Erweitertes Reporting mit Diagrammen
