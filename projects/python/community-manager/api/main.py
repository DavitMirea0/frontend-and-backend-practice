from fastapi import FastAPI

from api.routers import auth, communities, events, publications, users

app = FastAPI(title="Community Manager Admin API")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(communities.router)
app.include_router(publications.router)
app.include_router(events.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
