# Mathematik Fach-Modul für PlanEd
# Enthält alle Endpunkte für die Mathematik-Unterrichtsplanung

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timezone
import asyncio
import uuid
import os
import logging

from services.auth import get_db, get_current_user
from data.lehrplan_mathe_rlp import LEHRPLAN_MATHE_RLP
from data.schulbuecher_mathe import SCHULBUECHER_MATHE

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mathe", tags=["mathematik"])


# ============== Pydantic Models ==============

from pydantic import BaseModel
from typing import Dict, Any

class MatheUnterrichtsreiheRequest(BaseModel):
    klassenstufe: str
    kompetenzbereich: str
    thema_id: str
    niveau: str  # G, M, E
    stunden_anzahl: int = 6
    schulbuch_id: Optional[str] = None


# ============== LEHRPLAN STRUKTUR ==============

@router.get("/struktur")
async def get_mathe_lehrplan_struktur(user_id: str = Depends(get_current_user)):
    """Gibt die komplette LP-Struktur für Mathematik zurück"""
    struktur = {}
    for klassenstufe, bereiche in LEHRPLAN_MATHE_RLP.items():
        struktur[klassenstufe] = {}
        for bereich_id, bereich_data in bereiche.items():
            struktur[klassenstufe][bereich_id] = {
                "name": bereich_data["name"],
                "themen": [{"id": t["id"], "name": t["name"]} for t in bereich_data["themen"]]
            }
    return {"fach": "Mathematik", "bundesland": "RLP", "schulart": "RS+", "struktur": struktur}


@router.get("/thema")
async def get_mathe_thema_details(
    klassenstufe: str = Query(...),
    kompetenzbereich: str = Query(...),
    thema_id: str = Query(...),
    user_id: str = Depends(get_current_user)
):
    """Gibt Details zu einem spezifischen Mathe-Thema zurück"""
    try:
        bereich = LEHRPLAN_MATHE_RLP.get(klassenstufe, {}).get(kompetenzbereich, {})
        themen = bereich.get("themen", [])
        for thema in themen:
            if thema["id"] == thema_id:
                return {
                    "klassenstufe": klassenstufe,
                    "kompetenzbereich": bereich.get("name", kompetenzbereich),
                    "thema": thema
                }
        raise HTTPException(status_code=404, detail="Thema nicht gefunden")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== SCHULBÜCHER ==============

@router.get("/schulbuecher")
async def get_mathe_schulbuecher(
    klassenstufe: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user)
):
    """Gibt verfügbare Mathe-Schulbücher zurück"""
    try:
        result = []
        for buch_id, buch in SCHULBUECHER_MATHE.items():
            if klassenstufe and buch["klassenstufe"] != "alle":
                if klassenstufe not in buch["klassenstufe"]:
                    continue
            result.append({
                "id": buch["id"],
                "name": buch["name"],
                "verlag": buch["verlag"],
                "isbn": buch["isbn"],
                "klassenstufe": buch["klassenstufe"],
                "kapitel": list(buch["kapitel"].keys())
            })
        return {"schulbuecher": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== UNTERRICHTSREIHE GENERIEREN ==============

@router.post("/unterrichtsreihe/generieren")
async def generiere_mathe_unterrichtsreihe(
    request: MatheUnterrichtsreiheRequest,
    user_id: str = Depends(get_current_user)
):
    """Generiert eine Mathematik-Unterrichtsreihe mit KI"""
    import json as json_lib
    db = get_db()
    
    try:
        # Hole Thema-Details
        bereich = LEHRPLAN_MATHE_RLP.get(request.klassenstufe, {}).get(request.kompetenzbereich, {})
        thema_data = None
        for t in bereich.get("themen", []):
            if t["id"] == request.thema_id:
                thema_data = t
                break
        
        if not thema_data:
            raise HTTPException(status_code=404, detail="Thema nicht gefunden")
        
        niveau_text = thema_data.get(request.niveau, "")
        niveau_name = {"G": "grundlegend", "M": "mittel", "E": "erweitert"}.get(request.niveau, "mittel")
        
        # Schulbuch-Informationen vorbereiten
        schulbuch_info = ""
        schulbuch_name = None
        if request.schulbuch_id and request.schulbuch_id != "kein_schulbuch":
            schulbuch = SCHULBUECHER_MATHE.get(request.schulbuch_id)
            if schulbuch:
                schulbuch_name = f"{schulbuch['name']} ({schulbuch['verlag']})"
                kapitel_info = []
                for kap_id, kap_data in schulbuch.get("kapitel", {}).items():
                    # Finde passende Kapitel
                    thema_lower = thema_data["name"].lower()
                    kap_name_lower = kap_data["name"].lower()
                    if any(word in kap_name_lower for word in thema_lower.split()):
                        kapitel_info.append(f"- {kap_data['name']}: Seiten {kap_data['seiten']}")
                
                if not kapitel_info:
                    for kap_id, kap_data in schulbuch.get("kapitel", {}).items():
                        kapitel_info.append(f"- {kap_data['name']}: Seiten {kap_data['seiten']}")
                
                schulbuch_info = f"""
SCHULBUCH-BEZUG:
Verwende das Schulbuch "{schulbuch['name']}" ({schulbuch['verlag']}, ISBN: {schulbuch['isbn']}).
Relevante Kapitel:
{chr(10).join(kapitel_info)}

Bei jeder Stunde: Gib konkrete Seitenzahlen und Aufgabennummern an."""
        
        from services.openai_helper import chat_completion
        
        system_msg = """Du bist ein erfahrener Mathematiklehrer an einer Realschule plus in Rheinland-Pfalz. 
Du erstellst praxisnahe, differenzierte Unterrichtsreihen für den Mathematikunterricht.
Deine Unterrichtsreihen enthalten konkrete Aufgaben, Beispiele und Übungen.
Wenn ein Schulbuch angegeben ist, integrierst du passende Seiten und Aufgaben.
Antworte IMMER im JSON-Format."""
        
        json_format = """{
    "titel": "Titel der Unterrichtsreihe",
    "ueberblick": "Kurze Beschreibung (2-3 Sätze)",
    "schulbuch": "Name des Schulbuchs (falls verwendet)",
    "lernziele": ["Übergeordnetes Lernziel 1", "Übergeordnetes Lernziel 2"],
    "stunden": [
        {
            "nummer": 1,
            "titel": "Titel der Stunde",
            "lernziel": "Konkretes Lernziel dieser Stunde (Die SuS können...)",
            "phase": "Einstieg/Erarbeitung/Übung/Sicherung",
            "dauer": "45 min",
            "inhalt": "Detaillierte Beschreibung mit konkreten Beispielaufgaben",
            "aufgaben": ["Konkrete Aufgabe 1", "Konkrete Aufgabe 2"],
            "methoden": ["Methode 1", "Methode 2"],
            "material": ["Benötigtes Material"],
            "schulbuch_seiten": "z.B. S. 34-36, Aufgabe 1-3",
            "beispielaufgabe": "Eine konkrete Beispielaufgabe für diese Stunde"
        }
    ],
    "differenzierung": {
        "foerdern": "Maßnahmen für schwächere SuS",
        "fordern": "Maßnahmen für stärkere SuS"
    },
    "leistungsnachweis": "Vorschlag für Leistungsüberprüfung"
}"""
        
        prompt = f"""Erstelle eine Unterrichtsreihe für Mathematik RS+ mit folgenden Parametern:

Klassenstufe: {request.klassenstufe}
Kompetenzbereich: {bereich.get('name', request.kompetenzbereich)}
Thema: {thema_data['name']}
Lehrplaninhalt ({niveau_name}): {niveau_text}
Niveau: {niveau_name}
Anzahl Unterrichtsstunden: {request.stunden_anzahl}
{schulbuch_info}

Erstelle eine detaillierte Unterrichtsreihe im folgenden JSON-Format:
{json_format}

Wichtig: 
- Genau {request.stunden_anzahl} Stunden erstellen
- Niveau {niveau_name} beachten
- JEDE Stunde muss ein konkretes "lernziel" haben (beginnt mit "Die SuS können...")
- JEDE Stunde muss 2-4 konkrete "aufgaben" haben (z.B. "Übungsaufgaben rechnen", "Sachaufgabe lösen")
- KONKRETE Beispielaufgaben mit Zahlen bei jeder Stunde
- Mathematische Notation klar und verständlich
- Nur valides JSON zurückgeben"""

        response = await asyncio.wait_for(
            chat_completion(prompt=prompt, system_message=system_msg, model="gpt-4o-mini"),
            timeout=60.0
        )
        
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        unterrichtsreihe = json_lib.loads(response_text.strip())
        
        doc = {
            "user_id": user_id,
            "fach": "mathematik",
            "klassenstufe": request.klassenstufe,
            "kompetenzbereich": request.kompetenzbereich,
            "thema_id": request.thema_id,
            "niveau": request.niveau,
            "schulbuch_id": request.schulbuch_id,
            "schulbuch_name": schulbuch_name,
            "unterrichtsreihe": unterrichtsreihe,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        result = await db.unterrichtsreihen.insert_one(doc)
        
        return {
            "id": str(result.inserted_id),
            "unterrichtsreihe": unterrichtsreihe,
            "schulbuch": schulbuch_name,
            "meta": {
                "fach": "Mathematik",
                "klassenstufe": request.klassenstufe,
                "thema": thema_data["name"],
                "niveau": niveau_name
            }
        }
        
    except json_lib.JSONDecodeError as e:
        logger.error(f"JSON Parse error: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Parsen der KI-Antwort")
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="KI-Anfrage Timeout")
    except Exception as e:
        logger.error(f"Mathe Unterrichtsreihe generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== MATERIAL GENERIEREN ==============

class MatheMaterialRequest(BaseModel):
    thema: str
    niveau: str = "M"
    material_typ: str = "arbeitsblatt"
    klassenstufe: str = "5/6"

@router.post("/material/generieren")
async def generiere_mathe_material(
    request: MatheMaterialRequest,
    user_id: str = Depends(get_current_user)
):
    """Generiert Mathematik-Unterrichtsmaterial (Arbeitsblatt, Quiz, Rätsel) mit KI"""
    import json as json_lib
    
    try:
        from services.openai_helper import chat_completion
        
        niveau_name = {"G": "grundlegend", "M": "mittel", "E": "erweitert"}.get(request.niveau, "mittel")
        
        material_prompts = {
            "arbeitsblatt": f"""Erstelle ein Arbeitsblatt für Mathematik RS+ Klasse {request.klassenstufe} zum Thema "{request.thema}" (Niveau: {niveau_name}).

Das Arbeitsblatt soll enthalten:
- Überschrift
- Kurze Einleitung/Erklärung mit Formeln oder Regeln
- 5-8 Rechenaufgaben mit steigender Schwierigkeit
- KONKRETE Zahlenbeispiele (keine Variablen ohne Werte)
- Platz für Rechenwege

Format als JSON:
{{"titel": "...", "einleitung": "...", "aufgaben": [{{"nummer": 1, "titel": "...", "aufgabenstellung": "...", "punkte": 2}}], "loesung": [{{"nummer": 1, "loesung": "...", "rechenweg": "..."}}]}}""",

            "quiz": f"""Erstelle ein Quiz für Mathematik RS+ Klasse {request.klassenstufe} zum Thema "{request.thema}" (Niveau: {niveau_name}).

Das Quiz soll 8 Multiple-Choice-Fragen enthalten mit konkreten Rechenaufgaben.

Format als JSON:
{{"titel": "Quiz: {request.thema}", "fragen": [{{"nummer": 1, "frage": "...", "optionen": ["A) ...", "B) ...", "C) ...", "D) ..."], "richtig": "A", "erklaerung": "..."}}]}}""",

            "raetsel": f"""Erstelle ein Kreuzworträtsel für Mathematik RS+ Klasse {request.klassenstufe} zum Thema "{request.thema}" (Niveau: {niveau_name}).

Das Rätsel soll 8-10 mathematische Begriffe enthalten.

Format als JSON:
{{"titel": "Kreuzworträtsel: {request.thema}", "begriffe": [{{"wort": "...", "hinweis": "...", "richtung": "waagerecht/senkrecht", "nummer": 1}}], "loesung": ["Liste aller Lösungswörter"]}}""",

            "zuordnung": f"""Erstelle eine Zuordnungsübung für Mathematik RS+ Klasse {request.klassenstufe} zum Thema "{request.thema}" (Niveau: {niveau_name}).

Die Übung soll 8 Paare zum Zuordnen enthalten (z.B. Aufgabe → Ergebnis, Begriff → Definition).

Format als JSON:
{{"titel": "Zuordnung: {request.thema}", "anleitung": "Ordne die passenden Paare zu.", "paare": [{{"links": "...", "rechts": "..."}}], "tipp": "Ein hilfreicher Hinweis"}}""",

            "lueckentext": f"""Erstelle einen Lückentext für Mathematik RS+ Klasse {request.klassenstufe} zum Thema "{request.thema}" (Niveau: {niveau_name}).

Der Text soll mathematische Regeln und Formeln mit 8-10 Lücken erklären.

Format als JSON:
{{"titel": "Lückentext: {request.thema}", "text": "Der Text mit ___(1)___ Lücken ___(2)___ markiert...", "luecken": [{{"nummer": 1, "loesung": "...", "hinweis": "..."}}], "woerter_box": ["Liste der einzusetzenden Wörter (gemischt)"]}}"""
        }
        
        prompt = material_prompts.get(request.material_typ, material_prompts["arbeitsblatt"])
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"mathe-material-{user_id}-{uuid.uuid4()}",
            system_message="""Du bist ein erfahrener Mathematiklehrer an einer Realschule plus. 
Du erstellst klare, schülergerechte Unterrichtsmaterialien mit konkreten Zahlenbeispielen.
Antworte IMMER nur mit validem JSON, ohne Erklärungen."""
        ).with_model("gemini", "gemini-3-flash-preview")
        
        response = await asyncio.wait_for(
            chat.send_message(UserMessage(text=prompt)),
            timeout=45.0
        )
        
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        material = json_lib.loads(response_text.strip())
        
        return {
            "typ": request.material_typ,
            "niveau": niveau_name,
            "klassenstufe": request.klassenstufe,
            "thema": request.thema,
            "material": material
        }
        
    except json_lib.JSONDecodeError as e:
        logger.error(f"JSON Parse error: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Parsen der KI-Antwort")
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="KI-Anfrage Timeout")
    except Exception as e:
        logger.error(f"Mathe Material generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== GESPEICHERTE UNTERRICHTSREIHEN ==============

@router.get("/unterrichtsreihen")
async def get_saved_mathe_unterrichtsreihen(user_id: str = Depends(get_current_user)):
    """Gibt alle gespeicherten Mathe-Unterrichtsreihen des Nutzers zurück"""
    db = get_db()
    cursor = db.unterrichtsreihen.find({"user_id": user_id, "fach": "mathematik"})
    reihen = []
    async for doc in cursor:
        reihen.append({
            "id": str(doc["_id"]),
            "fach": "mathematik",
            "klassenstufe": doc.get("klassenstufe"),
            "kompetenzbereich": doc.get("kompetenzbereich"),
            "thema_id": doc.get("thema_id"),
            "niveau": doc.get("niveau"),
            "unterrichtsreihe": doc.get("unterrichtsreihe"),
            "created_at": doc.get("created_at")
        })
    return {"unterrichtsreihen": reihen}
