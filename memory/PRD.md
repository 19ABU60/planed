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
11. ✅ Freigabe von Arbeitsplänen für Kollegen
12. ✅ Push-Benachrichtigungen bei Änderungen
13. ✅ Drag & Drop für Unterrichtsstunden im Kalender

## Architecture
- **Backend**: FastAPI + MongoDB
- **Frontend**: React mit Dark Theme (Custom CSS)
- **Auth**: JWT-basierte Authentifizierung
- **AI**: Gemini 3 Flash via Emergent LLM Key
- **Drag & Drop**: @hello-pangea/dnd

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
- Sharing System für Kollegen
- Benachrichtigungs-System

### Frontend (App.js)
- Login/Registration Page mit deutschem Dark Theme
- Dashboard mit Bento Grid Layout
- Kalender-Ansicht (monatlich, mit Unterrichtsstunden)
- **NEU: Drag & Drop für Unterrichtsstunden**
- Statistik-Seite mit Diagrammen und Export-Buttons
- Klassen-Verwaltung
- Freigaben-Seite (Arbeitspläne mit Kollegen teilen)
- Benachrichtigungs-Glocke im Header
- Dokumente-Seite mit Upload
- Einstellungen-Seite
- Sidebar Navigation
- **Alle Beschriftungen auf Deutsch**

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- ✅ Core CRUD operations
- ✅ Calendar view
- ✅ Authentication
- ✅ Sharing with colleagues
- ✅ Notification system
- ✅ Drag & Drop for lessons

### P1 (Important) - Next Phase
- Ferienverwaltung mit deutschem Ferienkalender
- Batch-Erstellung von Unterrichtsstunden
- E-Mail-Benachrichtigungen

### P2 (Nice to Have)
- Vorlagen für häufige Lehrplanpunkte
- Offline-Modus (PWA)
- Mobile Optimierung

## Next Action Items
1. Deutsche Feiertage/Ferien automatisch laden
2. Batch-Import aus Excel
3. Erweitertes Reporting mit Diagrammen
