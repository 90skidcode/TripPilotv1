from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://trippilot_user:trippilot_password_change_me@localhost:3306/trippilot"
    SECRET_KEY: str = "trippilot-super-secret-jwt-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # Meta Webhooks & API Integration Credentials (System fallbacks)
    META_ACCESS_TOKEN: str = ""
    META_VERIFY_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    INSTAGRAM_PAGE_ID: str = ""
    META_API_VERSION: str = "v20.0"

    class Config:
        env_file = ".env"


settings = Settings()
