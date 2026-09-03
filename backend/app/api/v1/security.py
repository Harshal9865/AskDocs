from fastapi import APIRouter
from app.core.firewall import firewall_stats

router = APIRouter(prefix="/security", tags=["security"])


@router.get("/status")
async def get_security_status():
    """
    Get live Enterprise Firewall (WAF) stats, active threat defense layers,
    and zero-trust compliance standards.
    """
    return firewall_stats.to_dict()
