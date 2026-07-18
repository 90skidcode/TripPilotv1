from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.user_group import UserGroup

router = APIRouter()


def can_manage_users(current_user: User, db: Session) -> bool:
    """Whether this user may manage users and user groups.

    Allowed for superadmins, admin-role users, members of a group with
    users.write permission, and organization owners (first user of the org,
    consistent with the fallback in auth._user_with_permissions).
    """
    if current_user.is_superadmin or current_user.role in ("admin", "superadmin"):
        return True
    if current_user.group and current_user.group.permissions.get("users", {}).get("write", False):
        return True
    if not current_user.group_id:
        first_user = (
            db.query(User)
            .filter(User.org_id == current_user.org_id)
            .order_by(User.id.asc())
            .first()
        )
        return bool(first_user and first_user.id == current_user.id)
    return False


def require_users_write(current_user: User, db: Session) -> None:
    if not can_manage_users(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to manage users and groups",
        )


class PermissionMatrix(BaseModel):
    leads: dict = {"read": False, "write": False}
    itinerary: dict = {"read": False, "write": False}
    vouchers: dict = {"read": False, "write": False}
    inventory: dict = {"read": False, "write": False}
    dashboard: dict = {"read": False, "write": False}
    settings: dict = {"read": False, "write": False}
    users: dict = {"read": False, "write": False}


class UserGroupCreate(BaseModel):
    name: str
    permissions: PermissionMatrix


class UserGroupUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[PermissionMatrix] = None


class UserGroupOut(BaseModel):
    id: int
    org_id: int
    name: str
    permissions: dict

    class Config:
        from_attributes = True


@router.get("", response_model=List[UserGroupOut])
def list_user_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all user groups in current organization."""
    groups = db.query(UserGroup).filter(
        UserGroup.org_id == current_user.org_id
    ).all()
    return groups


@router.post("", response_model=UserGroupOut, status_code=201)
def create_user_group(
    payload: UserGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new user group with permission matrix."""
    require_users_write(current_user, db)

    group = UserGroup(
        org_id=current_user.org_id,
        name=payload.name,
        permissions=payload.permissions.dict(),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.get("/{group_id}", response_model=UserGroupOut)
def get_user_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific user group."""
    group = db.query(UserGroup).filter(
        UserGroup.id == group_id,
        UserGroup.org_id == current_user.org_id,
    ).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User group not found"
        )
    return group


@router.put("/{group_id}", response_model=UserGroupOut)
def update_user_group(
    group_id: int,
    payload: UserGroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a user group."""
    require_users_write(current_user, db)

    group = db.query(UserGroup).filter(
        UserGroup.id == group_id,
        UserGroup.org_id == current_user.org_id,
    ).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User group not found"
        )

    if payload.name:
        group.name = payload.name
    if payload.permissions:
        group.permissions = payload.permissions.dict()

    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=204)
def delete_user_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a user group."""
    require_users_write(current_user, db)

    group = db.query(UserGroup).filter(
        UserGroup.id == group_id,
        UserGroup.org_id == current_user.org_id,
    ).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User group not found"
        )

    db.delete(group)
    db.commit()
