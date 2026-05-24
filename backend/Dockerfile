FROM python:3.12-slim

# Metadata
LABEL maintainer="nexus-team"
LABEL description="NEXUS Backend - Django 5.x"

# Prevent Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       gcc \
       libpq-dev \
       curl \
       netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies — layer cached unless requirements change
COPY requirements.txt requirements.prod.txt ./
RUN pip install --no-cache-dir -r requirements.prod.txt

# Application source
COPY . .

# Create non-root user for security
RUN addgroup --system nexus && adduser --system --ingroup nexus nexus \
    && chown -R nexus:nexus /app

USER nexus

EXPOSE 8000

# Startup script: run migrations then launch gunicorn
COPY --chown=nexus:nexus entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
