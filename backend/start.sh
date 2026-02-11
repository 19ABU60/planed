#!/bin/bash

# Create .env file from environment variable if it exists
if [ ! -z "$OPENAI_API_KEY" ]; then
    echo "OPENAI_API_KEY=$OPENAI_API_KEY" > /app/.env
    echo "Created /app/.env with API key"
fi

# Start the application
exec uvicorn server:app --host 0.0.0.0 --port 8001
