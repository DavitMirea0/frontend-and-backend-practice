from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    bot_token: str = ""

    database_url: str = "postgresql+asyncpg://cmanager:cmanager_pass@db:5432/community_manager"

    redis_host: str = "redis"
    redis_port: int = 6379

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120

    admin_username: str = "admin"
    admin_password: str = "change-me"


settings = Settings()
