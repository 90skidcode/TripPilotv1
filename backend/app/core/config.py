from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., validation_alias="DATABASE_URL")
    SECRET_KEY: str = Field(..., validation_alias="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", validation_alias="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    GEMINI_API_KEY: str = Field(default="", validation_alias="GEMINI_API_KEY")
    OPENAI_API_KEY: str = Field(default="", validation_alias="OPENAI_API_KEY")

    GOOGLE_PLACES_API_KEY: str = Field(default="", validation_alias="GOOGLE_PLACES_API_KEY")
    GOOGLE_SEARCH_API_KEY: str = Field(default="", validation_alias="GOOGLE_SEARCH_API_KEY")
    GOOGLE_SEARCH_CX: str = Field(default="", validation_alias="GOOGLE_SEARCH_CX")

    META_ACCESS_TOKEN: str = Field(default="", validation_alias="META_ACCESS_TOKEN")
    META_VERIFY_TOKEN: str = Field(default="", validation_alias="META_VERIFY_TOKEN")
    WHATSAPP_PHONE_NUMBER_ID: str = Field(default="", validation_alias="WHATSAPP_PHONE_NUMBER_ID")
    INSTAGRAM_PAGE_ID: str = Field(default="", validation_alias="INSTAGRAM_PAGE_ID")
    META_API_VERSION: str = Field(default="v20.0", validation_alias="META_API_VERSION")

    class Config:
        env_file = ".env"


settings = Settings()
