from typing import List
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models import get_db, User, Role, Permission
from app.auth import get_current_user

DEFAULT_PERMISSIONS = [
    ("translate", "Use text translation"),
    ("dubbing", "Use video dubbing studio"),
    ("live_caption", "Use live caption agent console"),
    ("favorites", "Save favorites"),
    ("history", "View translation history"),
    ("admin_panel", "Access admin dashboard"),
    ("manage_users", "Create/delete users"),
    ("manage_roles", "Assign roles and permissions"),
]

DEFAULT_ROLES = {
    "user": {
        "description": "Free tier — basic features",
        "permissions": ["translate", "history", "favorites"],
    },
    "pro": {
        "description": "Paid tier — advanced features",
        "permissions": ["translate", "history", "favorites", "dubbing", "live_caption"],
    },
    "admin": {
        "description": "Full access",
        "permissions": [
            "translate", "history", "favorites", "dubbing", "live_caption",
            "admin_panel", "manage_users", "manage_roles",
        ],
    },
}

def seed_rbac(db: Session):
    for name, desc in DEFAULT_PERMISSIONS:
        if not db.query(Permission).filter(Permission.name == name).first():
            db.add(Permission(name=name, description=desc))
    db.commit()

    for role_name, config in DEFAULT_ROLES.items():
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            role = Role(name=role_name, description=config["description"])
            db.add(role)
            db.commit()
            db.refresh(role)

        current_perms = {p.name for p in role.permissions}
        for perm_name in config["permissions"]:
            if perm_name not in current_perms:
                perm = db.query(Permission).filter(Permission.name == perm_name).first()
                if perm:
                    role.permissions.append(perm)
        db.commit()

def get_user_permissions(user: User, db: Session) -> List[str]:
    role = db.query(Role).filter(Role.name == user.role).first()
    if not role:
        return []
    return [p.name for p in role.permissions]

def user_has_permission(user: User, permission: str, db: Session) -> bool:
    return permission in get_user_permissions(user, db)

def require_permission(permission: str):
    def checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> None:
        if not current_user.is_active:
            raise HTTPException(status_code=403, detail="Account disabled")
        if not user_has_permission(current_user, permission, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required",
            )
        return None
    return checker