import random
import string

from app.models.workspace import Role


def _email() -> str:
    return "user_" + "".join(random.choices(string.ascii_lowercase, k=10)) + "@test.dev"


async def _register_and_login(client) -> dict:
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


async def _setup_workspace(client, owner: dict) -> dict:
    """Returns {'ws_id', 'owner_id', 'admin2', 'member', 'outsider'} with roles set."""
    resp = await client.post(
        "/api/v1/workspaces", json={"name": f"WS {random.randint(0, 10**9)}"}, headers=owner["headers"]
    )
    ws_id = resp.json()["id"]

    admin2 = await _register_and_login(client)
    member = await _register_and_login(client)

    for user, role in ((admin2, "admin"), (member, "member")):
        r = await client.post(
            f"/api/v1/workspaces/{ws_id}/members",
            json={"email": user["email"], "role": role},
            headers=owner["headers"],
        )
        assert r.status_code == 201, r.text
    return {
        "ws_id": ws_id,
        "owner": owner,
        "admin2": admin2,
        "member": member,
    }


async def test_delete_conversation_owner_or_admin(client):
    env = await _setup_workspace(client, await _register_and_login(client))
    ws_id = env["ws_id"]

    # member creates a conversation
    conv = await client.post(f"/api/v1/workspaces/{ws_id}/conversations", json={}, headers=env["member"]["headers"])
    assert conv.status_code == 201
    conv_id = conv.json()["id"]
    assert conv.json()["user_id"] == await _user_id(client, env["member"])

    # unrelated outsider cannot see or delete -> 404
    outsider = await _register_and_login(client)
    r = await client.delete(f"/api/v1/conversations/{conv_id}", headers=outsider["headers"])
    assert r.status_code == 404

    # non-admin coworker cannot delete someone else's thread -> 403
    other_member = await _register_and_login(client)
    await client.post(
        f"/api/v1/workspaces/{ws_id}/members",
        json={"email": other_member["email"], "role": "member"},
        headers=env["owner"]["headers"],
    )
    r = await client.delete(f"/api/v1/conversations/{conv_id}", headers=other_member["headers"])
    assert r.status_code == 403

    # admin can delete it
    r = await client.delete(f"/api/v1/conversations/{conv_id}", headers=env["owner"]["headers"])
    assert r.status_code == 204

    # owner can delete their own
    conv = await client.post(f"/api/v1/workspaces/{ws_id}/conversations", json={}, headers=env["member"]["headers"])
    conv_id = conv.json()["id"]
    r = await client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "hello"},
        headers=env["member"]["headers"],
    )  # may fail if no docs; ignore result - message row exists regardless
    r = await client.delete(f"/api/v1/conversations/{conv_id}", headers=env["member"]["headers"])
    assert r.status_code == 204

    # gone -> 404 on messages read
    r = await client.get(f"/api/v1/conversations/{conv_id}/messages", headers=env["member"]["headers"])
    assert r.status_code == 404


async def _user_id(client, user: dict) -> str:
    me = await client.get("/api/v1/auth/me", headers=user["headers"])
    return me.json()["id"]


async def test_delete_workspace_admin_only_cascades(client):
    env = await _setup_workspace(client, await _register_and_login(client))
    ws_id = env["ws_id"]

    # member cannot delete -> 403
    r = await client.delete(f"/api/v1/workspaces/{ws_id}", headers=env["member"]["headers"])
    assert r.status_code == 403

    # outsider gets 404
    outsider = await _register_and_login(client)
    r = await client.delete(f"/api/v1/workspaces/{ws_id}", headers=outsider["headers"])
    assert r.status_code == 404

    # admin deletes -> 204 and workspace disappears for everyone
    r = await client.delete(f"/api/v1/workspaces/{ws_id}", headers=env["owner"]["headers"])
    assert r.status_code == 204

    r = await client.get(f"/api/v1/workspaces/{ws_id}/members", headers=env["admin2"]["headers"])
    assert r.status_code == 404

    # member's workspace list no longer includes it
    r = await client.get("/api/v1/workspaces", headers=env["member"]["headers"])
    assert all(w["id"] != ws_id for w in r.json())
