# OpenAI Helper für PlanEd
# Ersetzt emergentintegrations für externes Hosting

import os
import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

# OpenAI Client (lazy initialized)
_client = None

def _load_env_from_file(filepath: str) -> dict:
    """Load environment variables from a file"""
    env_vars = {}
    try:
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip('"').strip("'")
                    env_vars[key] = value
    except FileNotFoundError:
        pass
    except Exception as e:
        logger.warning(f"Error reading {filepath}: {e}")
    return env_vars

def _ensure_api_key_loaded() -> str:
    """Ensure OPENAI_API_KEY is loaded, trying multiple sources"""
    api_key = os.environ.get("OPENAI_API_KEY")
    
    if api_key:
        return api_key
    
    # Try loading from known .env file locations
    env_paths = ['/app/config/.env', '/app/.env', '/app/backend/.env']
    
    for env_path in env_paths:
        env_vars = _load_env_from_file(env_path)
        if 'OPENAI_API_KEY' in env_vars:
            api_key = env_vars['OPENAI_API_KEY']
            # Also set it in the environment for other components
            os.environ['OPENAI_API_KEY'] = api_key
            logger.info(f"Loaded OPENAI_API_KEY from {env_path}")
            return api_key
    
    return None

def get_openai_client():
    """Get or create the OpenAI client"""
    global _client
    
    if _client is not None:
        return _client
    
    api_key = _ensure_api_key_loaded()
    
    if not api_key:
        raise ValueError(
            "OpenAI nicht konfiguriert. Bitte erstellen Sie die Datei /app/config/.env "
            "mit Ihrem OPENAI_API_KEY auf dem Server."
        )
    
    _client = AsyncOpenAI(api_key=api_key)
    logger.info("OpenAI client initialized successfully")
    return _client

def reset_client():
    """Reset the client (useful for testing or key rotation)"""
    global _client
    _client = None

async def chat_completion(
    prompt: str,
    system_message: str = "Du bist ein hilfreicher Assistent.",
    model: str = "gpt-4o-mini",
    temperature: float = 0.7,
    max_tokens: int = 4000
) -> str:
    """
    Einfache Chat-Completion mit OpenAI
    
    Args:
        prompt: Die Benutzeranfrage
        system_message: System-Prompt
        model: OpenAI Modell (gpt-4o-mini, gpt-4o, gpt-3.5-turbo)
        temperature: Kreativität (0-1)
        max_tokens: Maximale Antwortlänge
    
    Returns:
        Die Antwort als String
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
