# Research API Routes for PlanEd
from fastapi import APIRouter, HTTPException, Depends
import httpx
import os
import asyncio
import logging

from services.auth import get_db, get_current_user

router = APIRouter(prefix="/api", tags=["research"])
logger = logging.getLogger(__name__)


@router.get("/research/images")
async def search_images(query: str, user_id: str = Depends(get_current_user)):
    """Search for educational images using Wikimedia Commons API (free, no API key required)"""
    try:
        results = []
        
        headers = {
            "User-Agent": "PlanEd/2.0 (Educational Teacher Planning Tool; contact@planed.app)"
        }
        
        async with httpx.AsyncClient(headers=headers) as http_client:
            response = await http_client.get(
                "https://commons.wikimedia.org/w/api.php",
                params={
                    "action": "query",
                    "format": "json",
                    "generator": "search",
                    "gsrsearch": f"filetype:bitmap {query}",
                    "gsrlimit": 15,
                    "gsrnamespace": 6,
                    "prop": "imageinfo",
                    "iiprop": "url|extmetadata|size",
                    "iiurlwidth": 400
                },
                timeout=15.0
            )
            
            if response.status_code == 200:
                data = response.json()
                pages = data.get("query", {}).get("pages", {})
                
                for page_id, page in pages.items():
                    if "imageinfo" in page and page.get("imageinfo"):
                        info = page["imageinfo"][0]
                        extmeta = info.get("extmetadata", {})
                        
                        desc = extmeta.get("ImageDescription", {}).get("value", "")
                        if desc:
                            import re
                            desc = re.sub('<[^<]+?>', '', desc)[:100]
                        else:
                            desc = page.get("title", "").replace("File:", "").replace("_", " ")
                        
                        author = extmeta.get("Artist", {}).get("value", "")
                        if author:
                            import re
                            author = re.sub('<[^<]+?>', '', author)[:50]
                        else:
                            author = "Wikimedia Commons"
                        
                        results.append({
                            "id": str(page_id),
                            "url": info.get("descriptionurl", info.get("url", "")),
                            "thumb": info.get("thumburl", info.get("url", "")),
                            "description": desc,
                            "author": author,
                            "download_url": info.get("url", ""),
                            "source": "Wikimedia Commons"
                        })
            
            if not results:
                from urllib.parse import quote
                url_encoded_query = quote(query)
                hyphen_query = query.replace(" ", "-").lower()
                results = [
                    {
                        "id": "search-wikimedia",
                        "url": f"https://commons.wikimedia.org/w/index.php?search={url_encoded_query}&title=Special:MediaSearch&type=image",
                        "thumb": None,
                        "description": f"Auf Wikimedia Commons nach '{query}' suchen",
                        "author": "Wikimedia Commons",
                        "download_url": f"https://commons.wikimedia.org/w/index.php?search={url_encoded_query}&title=Special:MediaSearch&type=image",
                        "source": "Wikimedia Commons",
                        "is_link": True
                    },
                    {
                        "id": "search-pixabay",
                        "url": f"https://pixabay.com/images/search/{url_encoded_query}/",
                        "thumb": None,
                        "description": f"Auf Pixabay nach '{query}' suchen",
                        "author": "Pixabay",
                        "download_url": f"https://pixabay.com/images/search/{url_encoded_query}/",
                        "source": "Pixabay",
                        "is_link": True
                    },
                    {
                        "id": "search-unsplash",
                        "url": f"https://unsplash.com/s/photos/{hyphen_query}",
                        "thumb": None,
                        "description": f"Auf Unsplash nach '{query}' suchen",
                        "author": "Unsplash",
                        "download_url": f"https://unsplash.com/s/photos/{hyphen_query}",
                        "source": "Unsplash",
                        "is_link": True
                    }
                ]
        
        return {"results": results, "total": len(results)}
    except Exception as e:
        logger.error(f"Image search error: {e}")
        return {"results": [], "total": 0, "error": str(e)}


@router.get("/research/videos")
async def search_videos(query: str, user_id: str = Depends(get_current_user)):
    """Search for educational YouTube videos"""
    try:
        results = []
        
        api_key = os.environ.get("YOUTUBE_API_KEY", "")
        if api_key:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/youtube/v3/search",
                    params={
                        "part": "snippet",
                        "q": f"{query} Unterricht Schule",
                        "type": "video",
                        "maxResults": 10,
                        "relevanceLanguage": "de",
                        "safeSearch": "strict",
                        "key": api_key
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    for item in data.get("items", []):
                        results.append({
                            "id": item["id"]["videoId"],
                            "title": item["snippet"]["title"],
                            "description": item["snippet"]["description"][:200],
                            "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                            "channel": item["snippet"]["channelTitle"],
                            "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                            "source": "YouTube"
                        })
        
        if not results:
            educational_channels = [
                {"name": "simpleclub", "topic": "Mathematik, Physik, Chemie"},
                {"name": "MrWissen2go", "topic": "Geschichte, Politik"},
                {"name": "Duden Learnattack", "topic": "Alle Fächer"},
                {"name": "TheSimpleClub", "topic": "MINT-Fächer"},
                {"name": "musstewissen", "topic": "Deutsch, Mathe, Chemie"},
            ]
            
            return {
                "results": [],
                "total": 0,
                "message": "YouTube-Suche benötigt API-Key. Empfohlene Bildungskanäle:",
                "suggestions": educational_channels,
                "search_url": f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}+Unterricht"
            }
        
        return {"results": results, "total": len(results)}
    except Exception as e:
        logger.error(f"Video search error: {e}")
        return {"results": [], "total": 0, "error": str(e)}


@router.get("/research/papers")
async def search_academic_papers(query: str, source: str = "semantic_scholar", user_id: str = Depends(get_current_user)):
    """Search for academic papers from Semantic Scholar or OpenAlex"""
    try:
        async with httpx.AsyncClient() as client:
            results = []
            
            if source == "semantic_scholar":
                response = await client.get(
                    "https://api.semanticscholar.org/graph/v1/paper/search",
                    params={
                        "query": query,
                        "limit": 10,
                        "fields": "title,abstract,authors,year,url,citationCount,openAccessPdf"
                    },
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    for paper in data.get("data", []):
                        results.append({
                            "id": paper.get("paperId", ""),
                            "title": paper.get("title", ""),
                            "abstract": paper.get("abstract", "")[:500] if paper.get("abstract") else "",
                            "authors": ", ".join([a.get("name", "") for a in paper.get("authors", [])[:3]]),
                            "year": paper.get("year"),
                            "citations": paper.get("citationCount", 0),
                            "url": paper.get("url", ""),
                            "pdf_url": paper.get("openAccessPdf", {}).get("url") if paper.get("openAccessPdf") else None,
                            "source": "Semantic Scholar"
                        })
            
            elif source == "openalex":
                response = await client.get(
                    "https://api.openalex.org/works",
                    params={
                        "search": query,
                        "per_page": 10,
                        "sort": "cited_by_count:desc"
                    },
                    headers={"User-Agent": "PlanEd-App/1.0"},
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    for work in data.get("results", []):
                        abstract = ""
                        if work.get("abstract_inverted_index"):
                            inv_idx = work["abstract_inverted_index"]
                            words = [(word, min(positions)) for word, positions in inv_idx.items()]
                            words.sort(key=lambda x: x[1])
                            abstract = " ".join([w[0] for w in words])[:500]
                        
                        results.append({
                            "id": work.get("id", "").split("/")[-1],
                            "title": work.get("title", ""),
                            "abstract": abstract,
                            "authors": ", ".join([a.get("author", {}).get("display_name", "") for a in work.get("authorships", [])[:3]]),
                            "year": work.get("publication_year"),
                            "citations": work.get("cited_by_count", 0),
                            "url": work.get("doi", "") if work.get("doi") else work.get("id", ""),
                            "pdf_url": work.get("open_access", {}).get("oa_url"),
                            "source": "OpenAlex"
                        })
            
            return {"results": results, "total": len(results)}
    except Exception as e:
        logger.error(f"Academic search error: {e}")
        return {"results": [], "total": 0, "error": str(e)}


@router.post("/research/translate")
async def translate_text(text: str = "", target_lang: str = "de", user_id: str = Depends(get_current_user)):
    """Translate text to German using AI"""
    if not text:
        return {"translated": "", "error": "No text provided"}
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        emergent_key = os.environ.get("EMERGENT_MODEL_API_KEY", "") or os.environ.get("EMERGENT_LLM_KEY", "")
        if not emergent_key:
            return {"translated": text, "error": "Translation service not configured"}
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"translate-{user_id}",
            system_message="Du bist ein professioneller Übersetzer für wissenschaftliche Texte. Übersetze Texte präzise ins Deutsche. Behalte Fachbegriffe bei, wenn sie im Deutschen üblich sind. Antworte NUR mit der Übersetzung, ohne Erklärungen oder zusätzliche Kommentare."
        ).with_model("gemini", "gemini-2.0-flash")
        
        prompt = f"Übersetze folgenden wissenschaftlichen Abstract ins Deutsche:\n\n{text[:2000]}"
        
        response = await asyncio.wait_for(
            chat.send_message(UserMessage(text=prompt)),
            timeout=30.0
        )
        
        return {"translated": response, "original": text[:500]}
    except asyncio.TimeoutError:
        return {"translated": text, "error": "Translation timeout"}
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return {"translated": text, "error": str(e)}
