FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN useradd --system --create-home appuser
COPY --chown=appuser:appuser . .
USER appuser

EXPOSE 8001
CMD ["gunicorn", "--bind", "0.0.0.0:8001", "app:app"]
