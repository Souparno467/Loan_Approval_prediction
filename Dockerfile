FROM python:3.14.2-slim

# Ensure Python runs in a consistent, container-friendly way
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies needed by LightGBM (OpenMP)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgomp1 && \
    rm -rf /var/lib/apt/lists/*

# Application root
WORKDIR /app

# Install only the minimal dependencies needed for the backend & ML pipeline
COPY requirements.docker.txt ./requirements.docker.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.docker.txt

# Copy project source
COPY . .

# Switch into backend directory so all relative paths (./raw, ./models, ./processed)
# used by Config and app.py resolve correctly.
WORKDIR /app/DataHandling

EXPOSE 5000

# Run the Flask backend
CMD ["python", "app.py"]
