# Base image Python nhẹ
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy dependency files
COPY requirements.txt .

# Cài dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ source code
COPY . .

# Expose port cho Kubernetes
EXPOSE 8001

# Start service
CMD ["python", "-m", "uvicorn", "inference:app", "--host", "0.0.0.0", "--port", "8001"]