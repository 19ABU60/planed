# OpenAI Helper für PlanEd
# Ersetzt emergentintegrations für externes Hosting

import os
from openai import AsyncOpenAI

# Load .env file if exists
try:
    from dotenv import load_dotenv
    load_dotenv('/app/.env')
except:
    pass

# OpenAI Client
_client = None

def get_openai_client():
    global _client
    if _client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            # Try reading directly from file
            try:
                with open('/app/.env', 'r') as f:
                    for line in f:
                        if line.startswith('OPENAI_API_KEY='):
                            api_key = line.strip().split('=', 1)[1]
                            break
            except:
                pass
        if not api_key:
            raise ValueError("OPENAI_API_KEY nicht konfiguriert")
        _client = AsyncOpenAI(api_key=api_key)
    return _client
    return _client

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
