from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://trippilot_user:trippilot_password_change_me@localhost:3306/trippilot"
    SECRET_KEY: str = "trippilot-super-secret-jwt-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # Google Programmable Search (Custom Search JSON API) — resolves place/hotel
    # names to real image URLs. GOOGLE_SEARCH_CX is the Search Engine ID.
    GOOGLE_SEARCH_API_KEY: str = "AIzaSyD5KEFq_ok_aJxtVTBOUvA0aF5_G6RqLe8"
    GOOGLE_SEARCH_CX: str = "b2f5437798cc340fb"

    # Meta Webhooks & API Integration Credentials (System fallbacks)
    META_ACCESS_TOKEN: str = ""
    META_VERIFY_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    INSTAGRAM_PAGE_ID: str = ""
    META_API_VERSION: str = "v20.0"

    class Config:
        env_file = ".env"


settings = Settings()
