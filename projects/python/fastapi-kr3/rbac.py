from fastapi import HTTPException, status, Depends
from typing import List, Callable
from functools import wrapsz    
ROLE_ADMIN = "admin"
ROLE_USER = "user"
ROLE_GUEST = "guest"
ROLE_PERMISSIONS = {
    ROLE_ADMIN: ["read", "write", "update", "delete", "admin"],
    ROLE_USER: ["read", "write", "update"],
    ROLE_GUEST: ["read"]
}
ROLE_HIERARCHY = {
    ROLE_GUEST: 0,
    ROLE_USER: 1,
    ROLE_ADMIN: 2
}
user_roles_db = {
    "admin_user": ROLE_ADMIN,
    "regular_user": ROLE_USER,
    "guest_user": ROLE_GUEST
}


def get_user_role(username: str) -> str:
    return user_roles_db.get(username, ROLE_GUEST)

def has_permission(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, [])

def has_role(required_role: str, user_role: str) -> bool:
    return ROLE_HIERARCHY.get(user_role, 0) >= ROLE_HIERARCHY.get(required_role, 0)

def get_current_user_with_role(current_user: str) -> dict:
    role = get_user_role(current_user)
    return {
        "username": current_user,
        "role": role
    }

def require_role(required_role: str):
    def role_checker(user_with_role: dict = Depends(get_current_user_with_role)):
        user_role = user_with_role["role"]
        username = user_with_role["username"]
        
        if not has_role(required_role, user_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required_role}, your role: {user_role}"
            )
        return user_with_role
    return role_checker

def require_permission(permission: str):
    def permission_checker(user_with_role: dict = Depends(get_current_user_with_role)):
        user_role = user_with_role["role"]
        username = user_with_role["username"]
        
        if not has_permission(user_role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {permission}, your role: {user_role}"
            )
        return user_with_role
    return permission_checker
require_admin = require_role(ROLE_ADMIN)
require_user = require_role(ROLE_USER)
require_guest = require_role(ROLE_GUEST)


def create_rbac_routes(app):
    from fastapi import APIRouter
    
    router = APIRouter(prefix="/rbac", tags=["RBAC"])
    
    @router.get("/public")
    async def public_endpoint(user: dict = Depends(require_guest)):
        return {
            "message": "This is public. Everyone can access.",
            "user": user
        }
    
    @router.get("/user-area")
    async def user_area(user: dict = Depends(require_user)):
        return {
            "message": "Welcome to user area!",
            "user": user,
            "data": ["User data 1", "User data 2"]
        }
    
    @router.get("/admin-panel")
    async def admin_panel(user: dict = Depends(require_admin)):
        return {
            "message": "Welcome to admin panel!",
            "user": user,
            "admin_data": {
                "total_users": 100,
                "active_sessions": 42,
                "system_status": "healthy"
            }
        }
    
    @router.post("/create-resource")
    async def create_resource(user: dict = Depends(require_user)):
        return {
            "message": "Resource created successfully",
            "created_by": user["username"],
            "role": user["role"]
        }
    
    @router.delete("/delete-resource/{resource_id}")
    async def delete_resource(resource_id: int, user: dict = Depends(require_admin)):
        return {
            "message": f"Resource {resource_id} deleted",
            "deleted_by": user["username"],
            "role": user["role"]
        }
    
    @router.get("/read-with-permission")
    async def read_with_permission(user: dict = Depends(require_permission("read"))):
        return {
            "message": "You have read permission",
            "user": user
        }
    @router.post("/write-with-permission")
    async def write_with_permission(user: dict = Depends(require_permission("write"))):
        return {
            "message": "You have write permission",
            "user": user
        }
    
    app.include_router(router)