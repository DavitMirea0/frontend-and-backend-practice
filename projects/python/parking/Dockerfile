FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN useradd --create-home appuser \
    && mkdir /data \
    && chown appuser:appuser /data

COPY app ./app
COPY seed.py .
COPY manage.py .

USER appuser
ENV DATABASE_URL=sqlite:////data/parking.db

EXPOSE 8000

CMD ["sh", "-c", "python seed.py && exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]
