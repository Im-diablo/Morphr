FROM python:3.9-slim

# Install LaTeX
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Security: run as non-root user
RUN useradd --create-home appuser && chown -R appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Use gunicorn for production instead of Flask dev server
CMD ["gunicorn", "main:app", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "180"]
