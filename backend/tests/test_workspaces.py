import random
import string

from app.models.workspace import Role


def _email() -> str:
    return "user_" + "".join(random.choices(string.ascii_lowercase, k=10)) + "@test.dev"


async def _register_and_login(client) -> dict:
    """Returns {'email', 'headers'} for an authenticated user."""
    email = _email()
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "secret123", "name": "User"},
    )
    resp = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": "secret123"}
    )
    tokens = resp.json()
    return {
        "email": email,
        "headers": {"Authorization": f"Bearer {tokens['access_token']}"},
    }


async def test_workspace_create_creator_is_admin(client):
    owner = await _register_and_login(client)
    resp = await client.post(
        "/api/v1/workspaces", json={"name": "Acme Team"}, headers=owner["headers"]
    )
    assert resp.status_code == 201, resp.text
    ws = resp.json()
    assert ws["slug"] == "acme-team"

    members = await client.get(
        f"/api/v1/workspaces/{ws['id']}/members", headers=owner["headers"]
    )
    assert members.status_code == 200
    assert members.json()[0]["role"] == Role.admin.value


async def test_rbac_isolation_and_roles(client):
    owner = await _register_and_login(client)
    member_user = await _register_and_login(client)
    outsider = await _register_and_login(client)

    resp = await client.post(
        "/api/v1/workspaces", json={"name": "RBAC WS"}, headers=owner["headers"]
    )
    ws_id = resp.json()["id"]

    # outsider sees nothing -> 404
    resp = await client.get(f"/api/v1/workspaces/{ws_id}/members", headers=outsider["headers"])
    assert resp.status_code == 404

    # non-admin member cannot invite: first add as admin-only route check via viewer
    # invite member_user as viewer by owner
    resp = await client.post(
        f"/api/v1/workspaces/{ws_id}/members",
        json={"email": member_user["email"], "role": "viewer"},
        headers=owner["headers"],
    )
    assert resp.status_code == 201, resp.text
    member_id = resp.json()["user_id"]

    # viewer cannot upload documents (role gate): use a fake file
    resp = await client.post(
        f"/api/v1/workspaces/{ws_id}/documents",
        files={"file": ("a.txt", b"hello", "text/plain")},
        headers=member_user["headers"],
    )
    assert resp.status_code == 403

    # owner promotes member_user to member
    resp = await client.patch(
        f"/api/v1/workspaces/{ws_id}/members/{member_id}",
        json={"role": "member"},
        headers=owner["headers"],
    )
    assert resp.status_code == 200

    # now member can upload but not delete (admin only)
    resp = await client.post(
        f"/api/v1/workspaces/{ws_id}/documents",
        files={"file": ("notes.txt", b"meeting notes content here", "text/plain")},
        headers=member_user["headers"],
    )
    assert resp.status_code == 201, resp.text
    doc_id = resp.json()["id"]
    assert resp.json()["status"] == "pending"

    resp = await client.delete(
        f"/api/v1/workspaces/{ws_id}/documents/{doc_id}",
        headers=member_user["headers"],
    )
    assert resp.status_code == 403

    # last-admin guard: owner cannot demote themselves
    me_resp = await client.get("/api/v1/auth/me", headers=owner["headers"])
    owner_id = me_resp.json()["id"]
    resp = await client.patch(
        f"/api/v1/workspaces/{ws_id}/members/{owner_id}",
        json={"role": "viewer"},
        headers=owner["headers"],
    )
    assert resp.status_code == 409

    # duplicate membership -> 409
    resp = await client.post(
        f"/api/v1/workspaces/{ws_id}/members",
        json={"email": member_user["email"], "role": "member"},
        headers=owner["headers"],
    )
    assert resp.status_code == 409

    # unknown invitee -> 404
    resp = await client.post(
        f"/api/v1/workspaces/{ws_id}/members",
        json={"email": "ghost@nowhere.dev", "role": "member"},
        headers=owner["headers"],
    )
    assert resp.status_code == 404
