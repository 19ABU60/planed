# Deutsch Fach-Modul für PlanEd
# Enthält alle Endpunkte für die Deutsch-Unterrichtsplanung

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timezone
import asyncio
import uuid
import os
import logging

from services.auth import get_db, get_current_user
from data.lehrplan_deutsch_rlp import LEHRPLAN_DEUTSCH_RLP
from data.schulbuecher_deutsch import SCHULBUECHER_DEUTSCH

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/lehrplan", tags=["deutsch"])


# ============== Pydantic Models ==============

from pydantic import BaseModel
from typing import Dict, Any

class UnterrichtsreiheRequest(BaseModel):
    klassenstufe: str
    kompetenzbereich: str
    thema_id: str
    niveau: str  # G, M, E
    stunden_anzahl: int = 6
    schulbuch_id: Optional[str] = None

class MaterialRequest(BaseModel):
    thema: str
    niveau: str
    material_typ: str  # arbeitsblatt, quiz, raetsel, zuordnung
    klassenstufe: str


# ============== LEHRPLAN STRUKTUR ==============

@router.get("/struktur")
async def get_lehrplan_struktur(user_id: str = Depends(get_current_user)):
    """Gibt die komplette LP-Struktur für das Auswahlmenü zurück"""
    struktur = {}
    for klassenstufe, bereiche in LEHRPLAN_DEUTSCH_RLP.items():
        struktur[klassenstufe] = {}
        for bereich_id, bereich_data in bereiche.items():
            struktur[klassenstufe][bereich_id] = {
                "name": bereich_data["name"],
                "themen": [{"id": t["id"], "name": t["name"]} for t in bereich_data["themen"]]
            }
    return {"fach": "Deutsch", "bundesland": "RLP", "schulart": "RS+", "struktur": struktur}


@router.get("/thema")
async def get_thema_details(
    klassenstufe: str = Query(...),
    kompetenzbereich: str = Query(...),
    thema_id: str = Query(...),
    user_id: str = Depends(get_current_user)
):
    """Gibt Details zu einem spezifischen Thema zurück"""
    try:
        bereich = LEHRPLAN_DEUTSCH_RLP.get(klassenstufe, {}).get(kompetenzbereich, {})
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
async def get_schulbuecher(
    klassenstufe: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user)
):
    """Gibt verfügbare Schulbücher zurück, optional gefiltert nach Klassenstufe"""
    try:
        result = []
        for buch_id, buch in SCHULBUECHER_DEUTSCH.items():
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
async def generiere_unterrichtsreihe(
    request: UnterrichtsreiheRequest,
    user_id: str = Depends(get_current_user)
):
    """Generiert eine Unterrichtsreihe mit KI, optional mit Schulbuch-Referenzen"""
    import json as json_lib
    db = get_db()
    
    try:
        # Hole Thema-Details
        bereich = LEHRPLAN_DEUTSCH_RLP.get(request.klassenstufe, {}).get(request.kompetenzbereich, {})
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
            schulbuch = SCHULBUECHER_DEUTSCH.get(request.schulbuch_id)
            if schulbuch:
                schulbuch_name = f"{schulbuch['name']} ({schulbuch['verlag']})"
                kapitel_info = []
                for kap_id, kap_data in schulbuch.get("kapitel", {}).items():
                    kap_themen_lower = [t.lower() for t in kap_data.get("themen", [])]
                    bereich_name_lower = bereich.get("name", "").lower()
                    if any(word in bereich_name_lower for word in ["schreib", "erzähl", "bericht"]) and kap_id in ["erzaehlen", "berichten"]:
                        kapitel_info.append(f"- {kap_data['name']}: Seiten {kap_data['seiten']}")
                    elif any(word in bereich_name_lower for word in ["lesen", "text", "literatur"]) and kap_id == "lesen":
                        kapitel_info.append(f"- {kap_data['name']}: Seiten {kap_data['seiten']}")
                    elif any(word in bereich_name_lower for word in ["sprach", "grammatik", "rechtschreib"]) and kap_id in ["grammatik", "rechtschreibung"]:
                        kapitel_info.append(f"- {kap_data['name']}: Seiten {kap_data['seiten']}")
                    elif any(word in bereich_name_lower for word in ["argument", "diskut"]) and kap_id == "argumentieren":
                        kapitel_info.append(f"- {kap_data['name']}: Seiten {kap_data['seiten']}")
                
                if not kapitel_info:
                    for kap_id, kap_data in schulbuch.get("kapitel", {}).items():
                        kapitel_info.append(f"- {kap_data['name']}: Seiten {kap_data['seiten']}")
                
                schulbuch_info = f"""
SCHULBUCH-BEZUG:
Verwende das Schulbuch "{schulbuch['name']}" ({schulbuch['verlag']}, ISBN: {schulbuch['isbn']}).
Relevante Kapitel:
{chr(10).join(kapitel_info)}

Bei jeder Stunde: Gib konkrete Seitenzahlen an, z.B. "S. 34-36" oder "Aufgabe 3 auf S. 42".
Füge bei jedem Material-Eintrag einen Schulbuch-Verweis hinzu wenn passend."""
        
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        emergent_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if not emergent_key:
            raise HTTPException(status_code=500, detail="KI-Service nicht konfiguriert")
        
        system_msg = """Du bist ein erfahrener Deutschlehrer an einer Realschule plus in Rheinland-Pfalz. 
Du erstellst praxisnahe, differenzierte Unterrichtsreihen für den Deutschunterricht.
Deine Unterrichtsreihen sind klar strukturiert, schülerorientiert und enthalten konkrete Aktivitäten.
Wenn ein Schulbuch angegeben ist, integrierst du passende Seiten und Aufgaben aus diesem Buch.
Antworte IMMER im JSON-Format."""
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"unterricht-{user_id}-{uuid.uuid4()}",
            system_message=system_msg
        ).with_model("gemini", "gemini-3-flash-preview")
        
        json_format = """{
    "titel": "Titel der Unterrichtsreihe",
    "ueberblick": "Kurze Beschreibung (2-3 Sätze)",
    "schulbuch": "Name des Schulbuchs (falls verwendet)",
    "lernziele": ["Lernziel 1", "Lernziel 2", "Lernziel 3"],
    "stunden": [
        {
            "nummer": 1,
            "titel": "Titel der Stunde",
            "phase": "Einstieg/Erarbeitung/Sicherung",
            "dauer": "45 min",
            "inhalt": "Detaillierte Beschreibung der Stundeninhalte",
            "methoden": ["Methode 1", "Methode 2"],
            "material": ["Benötigtes Material"],
            "schulbuch_seiten": "z.B. S. 34-36, Aufgabe 1-3"
        }
    ],
    "differenzierung": {
        "foerdern": "Maßnahmen für schwächere SuS",
        "fordern": "Maßnahmen für stärkere SuS"
    },
    "leistungsnachweis": "Vorschlag für Leistungsüberprüfung"
}"""
        
        prompt = f"""Erstelle eine Unterrichtsreihe für Deutsch RS+ mit folgenden Parametern:

Klassenstufe: {request.klassenstufe}
Kompetenzbereich: {bereich.get('name', request.kompetenzbereich)}
Thema: {thema_data['name']}
Lehrplaninhalt ({niveau_name}): {niveau_text}
Niveau: {niveau_name} ({"einfacher, mehr Unterstützung" if request.niveau == "G" else "anspruchsvoller, mehr Eigenständigkeit" if request.niveau == "E" else "mittleres Anforderungsniveau"})
Anzahl Unterrichtsstunden: {request.stunden_anzahl}
{schulbuch_info}

Erstelle eine detaillierte Unterrichtsreihe im folgenden JSON-Format:
{json_format}

Wichtig: 
- Genau {request.stunden_anzahl} Stunden erstellen
- Niveau {niveau_name} beachten
- Praxisnah und umsetzbar
{"- Bei JEDER Stunde konkrete Schulbuch-Seitenzahlen angeben!" if schulbuch_info else "- schulbuch_seiten kann leer bleiben wenn kein Schulbuch gewählt"}
- Nur valides JSON zurückgeben, keine Erklärungen davor oder danach"""

        response = await asyncio.wait_for(
            chat.send_message(UserMessage(text=prompt)),
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
        logger.error(f"Unterrichtsreihe generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== MATERIAL GENERIEREN ==============

@router.post("/material/generieren")
async def generiere_material(
    request: MaterialRequest,
    user_id: str = Depends(get_current_user)
):
    """Generiert Unterrichtsmaterial (Arbeitsblatt, Quiz, Rätsel) mit KI"""
    import json as json_lib
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        emergent_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if not emergent_key:
            raise HTTPException(status_code=500, detail="KI-Service nicht konfiguriert")
        
        niveau_name = {"G": "grundlegend", "M": "mittel", "E": "erweitert"}.get(request.niveau, "mittel")
        
        material_prompts = {
            "arbeitsblatt": f"""Erstelle ein Arbeitsblatt für Deutsch RS+ Klasse {request.klassenstufe} zum Thema "{request.thema}" (Niveau: {niveau_name}).

Das Arbeitsblatt soll enthalten:
- Überschrift
- Kurze Einleitung/Erklärung
- 4-6 abwechslungsreiche Aufgaben
- Platz für Schülerantworten (markiert mit ___)

Format als JSON:
{{"titel": "...", "einleitung": "...", "aufgaben": [{{"nummer": 1, "aufgabenstellung": "...", "punkte": 2}}], "loesung": [{{"nummer": 1, "loesung": "..."}}]}}""",

            "quiz": f"""Erstelle ein Quiz für Deutsch RS+ Klasse {request.klassenstufe} zum Thema "{request.thema}" (Niveau: {niveau_name}).

Das Quiz soll 8 Multiple-Choice-Fragen enthalten.

Format als JSON:
{{"titel": "Quiz: {request.thema}", "fragen": [{{"nummer": 1, "frage": "...", "optionen": ["A) ...", "B) ...", "C) ...", "D) ..."], "richtig": "A", "erklaerung": "..."}}]}}""",

            "raetsel": f"""Erstelle ein Kreuzworträtsel für Deutsch RS+ Klasse {request.klassenstufe} zum Thema "{request.thema}" (Niveau: {niveau_name}).

Das Rätsel soll 8-10 Begriffe enthalten.

Format als JSON:
{{"titel": "Kreuzworträtsel: {request.thema}", "begriffe": [{{"wort": "...", "hinweis": "...", "richtung": "waagerecht/senkrecht", "nummer": 1}}], "loesung": ["Liste aller Lösungswörter"]}}""",

            "zuordnung": f"""Erstelle eine Zuordnungsübung für Deutsch RS+ Klasse {request.klassenstufe} zum Thema "{request.thema}" (Niveau: {niveau_name}).

Die Übung soll 8 Paare zum Zuordnen enthalten (z.B. Begriff → Definition, Beispiel → Regel).

Format als JSON:
{{"titel": "Zuordnung: {request.thema}", "anleitung": "Ordne die passenden Paare zu.", "paare": [{{"links": "...", "rechts": "..."}}], "tipp": "Ein hilfreicher Hinweis"}}""",

            "lueckentext": f"""Erstelle einen Lückentext für Deutsch RS+ Klasse {request.klassenstufe} zum Thema "{request.thema}" (Niveau: {niveau_name}).

Der Text soll 8-10 Lücken enthalten.

Format als JSON:
{{"titel": "Lückentext: {request.thema}", "text": "Der Text mit ___(1)___ Lücken ___(2)___ markiert...", "luecken": [{{"nummer": 1, "loesung": "...", "hinweis": "..."}}], "woerter_box": ["Liste der einzusetzenden Wörter (gemischt)"]}}"""
        }
        
        prompt = material_prompts.get(request.material_typ, material_prompts["arbeitsblatt"])
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"material-{user_id}-{uuid.uuid4()}",
            system_message="""Du bist ein erfahrener Deutschlehrer an einer Realschule plus. 
Du erstellst kreative, schülergerechte Unterrichtsmaterialien.
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
        logger.error(f"Material generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== GESPEICHERTE UNTERRICHTSREIHEN ==============

@router.get("/unterrichtsreihen")
async def get_saved_unterrichtsreihen(user_id: str = Depends(get_current_user)):
    """Gibt alle gespeicherten Unterrichtsreihen des Nutzers zurück"""
    db = get_db()
    cursor = db.unterrichtsreihen.find({"user_id": user_id})
    reihen = []
    async for doc in cursor:
        reihen.append({
            "id": str(doc["_id"]),
            "klassenstufe": doc.get("klassenstufe"),
            "kompetenzbereich": doc.get("kompetenzbereich"),
            "thema_id": doc.get("thema_id"),
            "niveau": doc.get("niveau"),
            "unterrichtsreihe": doc.get("unterrichtsreihe"),
            "created_at": doc.get("created_at")
        })
    return {"unterrichtsreihen": reihen}


@router.delete("/unterrichtsreihe/{reihe_id}")
async def delete_unterrichtsreihe(reihe_id: str, user_id: str = Depends(get_current_user)):
    """Löscht eine gespeicherte Unterrichtsreihe"""
    from bson import ObjectId
    db = get_db()
    try:
        result = await db.unterrichtsreihen.delete_one({
            "_id": ObjectId(reihe_id),
            "user_id": user_id
        })
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Unterrichtsreihe nicht gefunden")
        return {"success": True, "message": "Unterrichtsreihe gelöscht"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== WORD EXPORT ==============

from fastapi.responses import StreamingResponse
from io import BytesIO
from pydantic import BaseModel as PydanticBaseModel

class WordExportRequest(PydanticBaseModel):
    material_typ: str
    titel: str
    inhalt: dict

@router.post("/material/export/word")
async def export_material_to_word(
    request: WordExportRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Exportiert generiertes Material als Word-Dokument (.docx)
    Unterstützt: arbeitsblatt, quiz, raetsel, zuordnung
    """
    from docx import Document
    from docx.shared import Inches, Pt, Cm
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.style import WD_STYLE_TYPE
    
    material_typ = request.material_typ
    titel = request.titel
    inhalt = request.inhalt
    
    doc = Document()
    
    # Seitenränder setzen
    sections = doc.sections
    for section in sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)
    
    # Titel
    title = doc.add_heading(titel, 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Metadaten
    if inhalt.get("klassenstufe") or inhalt.get("niveau"):
        meta = doc.add_paragraph()
        meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
        meta_text = []
        if inhalt.get("klassenstufe"):
            meta_text.append(f"Klassenstufe {inhalt['klassenstufe']}")
        if inhalt.get("niveau"):
            niveau_map = {"G": "Grundniveau", "M": "Mittleres Niveau", "E": "Erweitertes Niveau"}
            meta_text.append(niveau_map.get(inhalt["niveau"], inhalt["niveau"]))
        meta.add_run(" • ".join(meta_text)).italic = True
    
    doc.add_paragraph()  # Leerzeile
    
    if material_typ == "arbeitsblatt":
        # Arbeitsblatt-Struktur
        aufgaben = inhalt.get("aufgaben", [])
        for i, aufgabe in enumerate(aufgaben, 1):
            # Aufgabentitel
            heading = doc.add_heading(f"Aufgabe {i}: {aufgabe.get('titel', '')}", level=2)
            
            # Aufgabenstellung
            if aufgabe.get("aufgabenstellung"):
                p = doc.add_paragraph(aufgabe["aufgabenstellung"])
            
            # Material/Text falls vorhanden
            if aufgabe.get("material"):
                doc.add_paragraph()
                material_para = doc.add_paragraph()
                material_para.add_run("Material: ").bold = True
                material_para.add_run(aufgabe["material"])
            
            # Platz für Antworten
            doc.add_paragraph()
            answer_lines = doc.add_paragraph("Antwort:")
            answer_lines.add_run("\n" + "_" * 60)
            answer_lines.add_run("\n" + "_" * 60)
            answer_lines.add_run("\n" + "_" * 60)
            
            doc.add_paragraph()  # Abstand zwischen Aufgaben
    
    elif material_typ == "quiz":
        # Quiz-Struktur
        fragen = inhalt.get("fragen", [])
        for i, frage in enumerate(fragen, 1):
            # Frage
            q_para = doc.add_paragraph()
            q_para.add_run(f"{i}. {frage.get('frage', '')}").bold = True
            
            # Antwortmöglichkeiten
            optionen = frage.get("optionen", [])
            for j, option in enumerate(optionen):
                # Prüfen ob Option bereits mit Buchstabe beginnt (z.B. "A) ...")
                option_text = str(option)
                if len(option_text) > 2 and option_text[1] in ')':
                    # Option hat bereits Buchstabe, nicht nochmal hinzufügen
                    doc.add_paragraph(f"   {option_text}")
                else:
                    buchstabe = chr(65 + j)  # A, B, C, D...
                    doc.add_paragraph(f"   {buchstabe}) {option_text}")
            
            doc.add_paragraph()  # Abstand
        
        # Lösungen am Ende
        doc.add_page_break()
        doc.add_heading("Lösungen", level=1)
        for i, frage in enumerate(fragen, 1):
            loesung = frage.get("loesung", "")
            doc.add_paragraph(f"{i}. {loesung}")
    
    elif material_typ == "raetsel":
        # Kreuzworträtsel mit echtem Gitter
        from docx.shared import Pt, Cm, RGBColor
        from docx.oxml.ns import qn
        from docx.oxml import OxmlElement
        
        doc.add_heading("Kreuzworträtsel", level=1)
        
        # Hole alle Begriffe
        begriffe = inhalt.get("begriffe", [])
        waagerecht = inhalt.get("waagerecht", [])
        senkrecht = inhalt.get("senkrecht", [])
        
        # Falls begriffe-Format verwendet wird, konvertiere es
        if begriffe and not waagerecht:
            waagerecht = [b for b in begriffe if b.get("richtung") == "waagerecht"]
            senkrecht = [b for b in begriffe if b.get("richtung") == "senkrecht"]
        
        # Sammle alle Lösungswörter
        alle_woerter = []
        for item in waagerecht:
            wort = item.get("loesung", item.get("wort", ""))
            if wort:
                alle_woerter.append({"wort": wort.upper(), "richtung": "H", "nummer": item.get("nummer", len(alle_woerter)+1)})
        for item in senkrecht:
            wort = item.get("loesung", item.get("wort", ""))
            if wort:
                alle_woerter.append({"wort": wort.upper(), "richtung": "V", "nummer": item.get("nummer", len(alle_woerter)+1)})
        
        if alle_woerter:
            # Berechne Gittergröße
            max_len = max(len(w["wort"]) for w in alle_woerter) if alle_woerter else 10
            grid_size = max(max_len + 2, len(alle_woerter) + 2, 12)
            
            # Erstelle Tabelle als Gitter
            table = doc.add_table(rows=grid_size, cols=grid_size)
            table.style = 'Table Grid'
            
            # Setze Zellengröße
            for row in table.rows:
                row.height = Cm(0.8)
                for cell in row.cells:
                    cell.width = Cm(0.8)
                    # Zentriere Text
                    cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
                    # Setze Schriftgröße
                    for paragraph in cell.paragraphs:
                        for run in paragraph.runs:
                            run.font.size = Pt(12)
                            run.font.bold = True
            
            # Platziere Wörter im Gitter (vereinfachte Platzierung)
            placed = []
            start_row = 1
            start_col = 1
            
            for idx, item in enumerate(alle_woerter):
                wort = item["wort"]
                nummer = item["nummer"]
                
                if item["richtung"] == "H":
                    # Horizontal platzieren
                    row_idx = start_row + idx
                    if row_idx < grid_size:
                        # Nummer in erste Zelle
                        cell = table.rows[row_idx].cells[start_col]
                        cell.paragraphs[0].clear()
                        run = cell.paragraphs[0].add_run(str(nummer))
                        run.font.size = Pt(8)
                        run.font.bold = False
                        
                        # Leere Kästchen für Buchstaben
                        for char_idx, char in enumerate(wort):
                            col_idx = start_col + char_idx + 1
                            if col_idx < grid_size:
                                cell = table.rows[row_idx].cells[col_idx]
                                # Leeres Kästchen (Schüler füllt aus)
                                cell.paragraphs[0].clear()
                else:
                    # Vertikal platzieren
                    col_idx = start_col + idx + len([w for w in alle_woerter[:idx] if w["richtung"] == "H"]) + 3
                    if col_idx < grid_size:
                        # Nummer in erste Zelle
                        cell = table.rows[start_row].cells[col_idx]
                        cell.paragraphs[0].clear()
                        run = cell.paragraphs[0].add_run(str(nummer))
                        run.font.size = Pt(8)
                        run.font.bold = False
                        
                        # Leere Kästchen für Buchstaben
                        for char_idx, char in enumerate(wort):
                            row_idx = start_row + char_idx + 1
                            if row_idx < grid_size:
                                cell = table.rows[row_idx].cells[col_idx]
                                cell.paragraphs[0].clear()
            
            # Schwarze Zellen für nicht verwendete Bereiche
            # (optional - macht das Rätsel schöner)
        
        doc.add_paragraph()
        doc.add_paragraph()
        
        # Hinweise (Fragen)
        doc.add_heading("Waagerecht →", level=2)
        for item in waagerecht:
            nummer = item.get("nummer", "")
            frage = item.get("frage", item.get("hinweis", ""))
            doc.add_paragraph(f"{nummer}. {frage}")
        
        doc.add_paragraph()
        
        doc.add_heading("Senkrecht ↓", level=2)
        for item in senkrecht:
            nummer = item.get("nummer", "")
            frage = item.get("frage", item.get("hinweis", ""))
            doc.add_paragraph(f"{nummer}. {frage}")
        
        # Lösungsseite
        doc.add_page_break()
        doc.add_heading("Lösungen", level=1)
        
        doc.add_heading("Waagerecht", level=2)
        for item in waagerecht:
            nummer = item.get("nummer", "")
            loesung = item.get("loesung", item.get("wort", ""))
            doc.add_paragraph(f"{nummer}. {loesung}")
        
        doc.add_heading("Senkrecht", level=2)
        for item in senkrecht:
            nummer = item.get("nummer", "")
            loesung = item.get("loesung", item.get("wort", ""))
            doc.add_paragraph(f"{nummer}. {loesung}")
        for item in senkrecht:
            doc.add_paragraph(f"{item.get('nummer', '')}: {item.get('frage', '')}")
        
        # Lösungswörter
        doc.add_page_break()
        doc.add_heading("Lösungen", level=1)
        doc.add_heading("Waagerecht", level=2)
        for item in waagerecht:
            doc.add_paragraph(f"{item.get('nummer', '')}: {item.get('loesung', '')}")
        doc.add_heading("Senkrecht", level=2)
        for item in senkrecht:
            doc.add_paragraph(f"{item.get('nummer', '')}: {item.get('loesung', '')}")
    
    elif material_typ == "zuordnung":
        # Zuordnungsübung
        doc.add_heading("Zuordnungsübung", level=1)
        doc.add_paragraph("Verbinde die zusammengehörenden Begriffe:")
        doc.add_paragraph()
        
        paare = inhalt.get("paare", [])
        
        # Linke Spalte
        doc.add_heading("Begriffe", level=2)
        for i, paar in enumerate(paare, 1):
            doc.add_paragraph(f"{i}. {paar.get('links', '')}")
        
        doc.add_paragraph()
        
        # Rechte Spalte (gemischt)
        doc.add_heading("Zuordnungen (durcheinander)", level=2)
        import random
        rechts_liste = [p.get("rechts", "") for p in paare]
        random.shuffle(rechts_liste)
        for buchstabe, item in zip("ABCDEFGHIJKLMNOP", rechts_liste):
            doc.add_paragraph(f"{buchstabe}. {item}")
        
        # Lösungen
        doc.add_page_break()
        doc.add_heading("Lösungen", level=1)
        for i, paar in enumerate(paare, 1):
            doc.add_paragraph(f"{i}. {paar.get('links', '')} → {paar.get('rechts', '')}")
    
    else:
        # Generischer Export
        doc.add_paragraph(str(inhalt))
    
    # Footer
    doc.add_paragraph()
    footer = doc.add_paragraph()
    footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    footer.add_run(f"Erstellt mit PlanEd • {datetime.now().strftime('%d.%m.%Y')}").italic = True
    
    # In BytesIO speichern
    file_stream = BytesIO()
    doc.save(file_stream)
    file_stream.seek(0)
    
    # Dateiname generieren
    safe_titel = "".join(c for c in titel if c.isalnum() or c in (' ', '-', '_')).strip()[:50]
    filename = f"{safe_titel}_{material_typ}.docx"
    
    return StreamingResponse(
        file_stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

