#!/bin/bash
set -e

echo "=== PlanEd Backend Startup Script ==="
echo "Timestamp: $(date)"

# Function to load .env file and export variables
load_env_file() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        echo "Found .env file at: $env_file"
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip comments and empty lines
            if [[ ! "$line" =~ ^[[:space:]]*# && -n "$line" && "$line" == *"="* ]]; then
                # Extract key and value
                key="${line%%=*}"
                value="${line#*=}"
                # Remove quotes if present
                value="${value%\"}"
                value="${value#\"}"
                value="${value%\'}"
                value="${value#\'}"
                # Export the variable
                export "$key"="$value"
                # Mask the value for logging
                if [ "$key" == "OPENAI_API_KEY" ]; then
                    echo "  - Loaded $key=sk-***...${value: -4}"
                else
                    echo "  - Loaded $key"
                fi
            fi
        done < "$env_file"
        return 0
    fi
    return 1
}

# Priority 1: Load from persistent volume
if load_env_file "/app/config/.env"; then
    echo "SUCCESS: Loaded environment from /app/config/.env"
fi

# Priority 2: Load from /app/.env if exists
if load_env_file "/app/.env"; then
    echo "SUCCESS: Loaded environment from /app/.env"
fi

# Priority 3: Create .env from environment variable (Coolify)
if [ ! -z "$OPENAI_API_KEY" ]; then
    echo "OPENAI_API_KEY found in environment, ensuring it's available"
fi

# Verify OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "WARNING: OPENAI_API_KEY is NOT set! AI features will not work."
    echo "Please create /app/config/.env with your API key."
else
    echo "OPENAI_API_KEY is configured (ends with: ...${OPENAI_API_KEY: -4})"
fi

echo "=== Starting uvicorn server ==="
exec uvicorn server:app --host 0.0.0.0 --port 8001
