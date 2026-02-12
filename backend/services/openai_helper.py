# OpenAI Helper für PlanEd
# Liest API Key direkt aus Datei - unabhängig von Umgebungsvariablen

import os
import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

# OpenAI Client (lazy initialized)
_client = None
_api_key_cache = None

def _read_api_key_from_file() -> str:
    """Read OPENAI_API_KEY directly from .env files"""
    env_paths = ['/app/config/.env', '/app/.env', '/app/backend/.env']
    
    for env_path in env_paths:
        try:
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('OPENAI_API_KEY='):
                        key = line.split('=', 1)[1]
                        # Remove quotes if present
                        key = key.strip('"').strip("'")
                        if key:
                            logger.info(f"Read OPENAI_API_KEY from {env_path}")
                            return key
        except FileNotFoundError:
            continue
        except Exception as e:
            logger.warning(f"Error reading {env_path}: {e}")
    
    return None

def get_api_key() -> str:
    """Get API key - from cache, file, or environment"""
    global _api_key_cache
    
    # Return cached key if available
    if _api_key_cache:
        return _api_key_cache
    
    # Try reading from file first (most reliable)
    _api_key_cache = _read_api_key_from_file()
    
    if _api_key_cache:
        return _api_key_cache
    
    # Fallback to environment variable
    _api_key_cache = os.environ.get("OPENAI_API_KEY")
    
    return _api_key_cache

def get_openai_client():
    """Get or create the OpenAI client"""
    global _client
    
    if _client is not None:
        return _client
    
    api_key = get_api_key()
    
    if not api_key:
        raise ValueError(
            "OpenAI nicht konfiguriert. Bitte erstellen Sie die Datei /app/config/.env "
            "mit OPENAI_API_KEY=Ihr-Key auf dem Server."
        )
    
    _client = AsyncOpenAI(api_key=api_key)
    logger.info(f"OpenAI client initialized (key ends with: ...{api_key[-4:]})")
    return _client

def reset_client():
    """Reset the client (useful for key rotation)"""
    global _client, _api_key_cache
    _client = None
    _api_key_cache = None

async def chat_completion(
    prompt: str,
    system_message: str = "Du bist ein hilfreicher Assistent.",
    model: str = "gpt-4o-mini",
    temperature: float = 0.7,
    max_tokens: int = 4000
) -> str:
    """
    Einfache Chat-Completion mit OpenAI
    """
    client = get_openai_client()
    
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ],
        temperature=temperature,
        max_tokens=max_tokens
    )
    
    return response.choices[0].message.content
