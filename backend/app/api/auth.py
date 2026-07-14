from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token, get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter()


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "agent"
    org_id: int | None = None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: str | None
    org_id: int
    group_id: int | None
    permissions: dict = {}
    # Organization settings
    advisor_name: str | None = None
    advisor_phone: str | None = None
    advisor_email: str | None = None
    agency_name: str | None = None
    agency_office_address: str | None = None
    agency_highlights: list | None = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


def _user_with_permissions(user: User, db: Session = None) -> dict:
    """Helper to add permissions and org settings to user."""
    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "org_id": user.org_id,
        "group_id": user.group_id,
        "permissions": user.group.permissions if user.group else {},
    }
    # Add organization settings
    if db:
        from app.models.organization import Organization
        org = db.query(Organization).filter(Organization.id == user.org_id).first()
        if org:
            user_dict.update({
                "advisor_name": org.advisor_name,
                "advisor_phone": org.advisor_phone,
                "advisor_email": org.advisor_email,
                "agency_name": org.agency_name,
                "agency_office_address": org.agency_office_address,
                "agency_highlights": org.agency_highlights,
            })
    return user_dict


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    org_id = payload.org_id or current_user.org_id
    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        org_id=org_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_with_permissions(user, db)


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer", "user": _user_with_permissions(user, db)}


@router.get("/me", response_model=UserOut)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _user_with_permissions(current_user, db)


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    # Organization settings
    advisor_name: str | None = None
    advisor_phone: str | None = None
    advisor_email: str | None = None
    agency_name: str | None = None
    agency_office_address: str | None = None
    agency_highlights: list | None = None


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all users in the current organization."""
    users = db.query(User).filter(User.org_id == current_user.org_id).all()
    return [_user_with_permissions(u, db) for u in users]


@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Update user fields
    if payload.name is not None:
        current_user.name = payload.name
    if payload.email is not None:
        existing = db.query(User).filter(User.email == payload.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered by another user")
        current_user.email = payload.email
    if payload.password is not None:
        if len(payload.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        current_user.hashed_password = hash_password(payload.password)

    # Update organization settings if provided
    from app.models.organization import Organization
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if org:
        if payload.advisor_name is not None:
            org.advisor_name = payload.advisor_name
        if payload.advisor_phone is not None:
            org.advisor_phone = payload.advisor_phone
        if payload.advisor_email is not None:
            org.advisor_email = payload.advisor_email
        if payload.agency_name is not None:
            org.agency_name = payload.agency_name
        if payload.agency_office_address is not None:
            org.agency_office_address = payload.agency_office_address
        if payload.agency_highlights is not None:
            org.agency_highlights = payload.agency_highlights

    db.commit()
    db.refresh(current_user)
    return _user_with_permissions(current_user, db)
