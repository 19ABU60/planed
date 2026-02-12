# Backend Dockerfile für PlanEd
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create config directory for persistent .env
RUN mkdir -p /app/config

# Make start script executable
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 8001

# Start with script (using shell form to ensure bash is used)
CMD ["/bin/bash", "/app/start.sh"]
