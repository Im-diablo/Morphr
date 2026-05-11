FROM python:3.12-slim

# ── System deps ────────────────────────────────────────────────────────────────
# curl + ca-certificates: needed to download Tectonic
# fontconfig: needed by Tectonic for font resolution on Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# ── Tectonic (self-contained LaTeX compiler, ~30 MB) ───────────────────────────
# Downloads packages on-demand from CTAN; no texlive-* required.
ARG TECTONIC_VERSION=0.15.0
RUN curl -fsSL \
    "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${TECTONIC_VERSION}/tectonic-${TECTONIC_VERSION}-x86_64-unknown-linux-musl.tar.gz" \
    | tar -xz -C /usr/local/bin \
    && chmod +x /usr/local/bin/tectonic \
    && tectonic --version

# Pre-cache Tectonic packages so the first request doesn't timeout the Render router
ENV TECTONIC_CACHE_DIR=/tmp/tectonic-cache
RUN mkdir -p /tmp/tectonic-cache \
    && echo "\\documentclass{article}\\begin{document}Hello\\end{document}" > dummy.tex \
    && tectonic dummy.tex \
    && rm dummy.*

# ── Python deps ────────────────────────────────────────────────────────────────
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── App code ───────────────────────────────────────────────────────────────────
COPY . .

# Create resumes dir (ephemeral on Render free tier — fine with 3h TTL)
RUN mkdir -p resumes

# Security: run as non-root user
RUN useradd --create-home --no-log-init appuser \
    && chown -R appuser:appuser /app
USER appuser

# Set cache dir for the runtime user
ENV TECTONIC_CACHE_DIR=/tmp/tectonic-cache

EXPOSE 8000

# Run Gunicorn with 1 worker to prevent Out-Of-Memory on 512MB free tier, with a long timeout
CMD ["gunicorn", "main:app", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "1", \
     "--timeout", "180", \
     "--preload"]
