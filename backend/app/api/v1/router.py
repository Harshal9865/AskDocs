from fastapi import APIRouter

from app.api.v1 import activity, auth, billing, chat, contracts, documents, friends, invitations, presence, teamchat, trash, workspaces

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(documents.router, tags=["documents"])
api_router.include_router(chat.router, tags=["chat"])
api_router.include_router(invitations.router, tags=["invitations"])
api_router.include_router(presence.router, prefix="/presence", tags=["presence"])
api_router.include_router(teamchat.router, tags=["team-chat"])
api_router.include_router(friends.router, tags=["friends"])
api_router.include_router(activity.router, tags=["activity"])
api_router.include_router(trash.router, tags=["trash-search-insights"])
api_router.include_router(contracts.router, prefix="/workspaces/{workspace_id}/contracts", tags=["contracts"])
