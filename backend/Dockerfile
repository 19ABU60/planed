# Backend Dockerfile für PlanEd
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8001

# Start server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
