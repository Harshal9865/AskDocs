import random
import string

import pytest


def _email() -> str:
    return "user_" + "".join(random.choices(string.ascii_lowercase, k=10)) + "@test.dev"


async def _register_and_login(client) -> dict:
    email = _email()
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "secret123", "name": f"User {email[:8]}"},
    )
    resp = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": "secret123"}
    )
    tokens = resp.json()
    me = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    return {
        "email": email,
        "id": me.json()["id"],
        "headers": {"Authorization": f"Bearer {tokens['access_token']}"},
    }


async def _workspace_with(client, owner: dict, *users, role="member") -> str:
    resp = await client.post(
        "/api/v1/workspaces", json={"name": f"WS {random.randint(0, 10**9)}"}, headers=owner["headers"]
    )
    ws_id = resp.json()["id"]
    for u in users:
        r = await client.post(
            f"/api/v1/workspaces/{ws_id}/members",
            json={"email": u["email"], "role": role},
            headers=owner["headers"],
        )
        assert r.status_code == 201, r.text
        # invitee accepts
        invites = (await client.get("/api/v1/invitations", headers=u["headers"])).json()
        target = next(i for i in invites if i["workspace_id"] == ws_id)
        acc = await client.post(f"/api/v1/invitations/{target['id']}/accept", headers=u["headers"])
        assert acc.status_code == 200, acc.text
    return ws_id


async def test_invitation_flow_accept(client):
    owner = await _register_and_login(client)
    invitee = await _register_and_login(client)

    ws_id = (
        await client.post("/api/v1/workspaces", json={"name": "InvFlow"}, headers=owner["headers"])
    ).json()["id"]

    # invite
    r = await client.post(
        f"/api/v1/workspaces/{ws_id}/members",
        json={"email": invitee["email"], "role": "member"},
        headers=owner["headers"],
    )
    assert r.status_code == 201, r.text

    # duplicate pending invite -> 409
    r = await client.post(
        f"/api/v1/workspaces/{ws_id}/members",
        json={"email": invitee["email"], "role": "viewer"},
        headers=owner["headers"],
    )
    assert r.status_code == 409

    # NOT a member yet - cannot see workspace members or docs
    r = await client.get(f"/api/v1/workspaces/{ws_id}/members", headers=invitee["headers"])
    assert r.status_code == 404

    # invitee sees it in /invitations with workspace preview
    invites = (await client.get("/api/v1/invitations", headers=invitee["headers"])).json()
    assert len(invites) == 1
    inv = invites[0]
    preview = await client.get(f"/api/v1/invitations/{inv['id']}/workspace", headers=invitee["headers"])
    assert preview.status_code == 200
    assert preview.json()["workspace_name"] == "InvFlow"

    # other users cannot accept someone else's invitation -> 404
    stranger = await _register_and_login(client)
    r = await client.post(f"/api/v1/invitations/{inv['id']}/accept", headers=stranger["headers"])
    assert r.status_code == 404

    # decline then re-invite works again (decline freed nothing; but new invite blocked?)
    r = await client.post(f"/api/v1/invitations/{inv['id']}/accept", headers=invitee["headers"])
    assert r.status_code == 200
    assert r.json()["status"] == "accepted"

    # now a member: can list members
    r = await client.get(f"/api/v1/workspaces/{ws_id}/members", headers=invitee["headers"])
    assert r.status_code == 200
    emails = [m["email"] for m in r.json()]
    assert owner["email"] in emails and invitee["email"] in emails


async def test_invitation_decline_and_cancel(client):
    owner = await _register_and_login(client)
    invitee = await _register_and_login(client)
    ws_id = (
        await client.post("/api/v1/workspaces", json={"name": "DeclWS"}, headers=owner["headers"])
    ).json()["id"]
    r = await client.post(
        f"/api/v1/workspaces/{ws_id}/members",
        json={"email": invitee["email"], "role": "viewer"},
        headers=owner["headers"],
    )
    inv = r.json()

    # admin cancels
    r = await client.delete(
        f"/api/v1/workspaces/{ws_id}/invitations/{inv['id']}", headers=owner["headers"]
    )
    assert r.status_code == 204
    # no longer visible to invitee
    invites = (await client.get("/api/v1/invitations", headers=invitee["headers"])).json()
    assert all(i["id"] != inv["id"] for i in invites)

    # re-invite after cancel is allowed and decline works
    r = await client.post(
        f"/api/v1/workspaces/{ws_id}/members",
        json={"email": invitee["email"], "role": "viewer"},
        headers=owner["headers"],
    )
    assert r.status_code == 201
    inv2 = r.json()
    r = await client.post(f"/api/v1/invitations/{inv2['id']}/decline", headers=invitee["headers"])
    assert r.status_code == 200
    assert r.json()["status"] == "declined"
    # not a member still
    r = await client.get(f"/api/v1/workspaces/{ws_id}/members", headers=invitee["headers"])
    assert r.status_code == 404


async def test_presence_online_flag(client):
    owner = await _register_and_login(client)
    member = await _register_and_login(client)
    ws_id = await _workspace_with(client, owner, member)

    # before any ping, member shows offline
    members = (await client.get(f"/api/v1/workspaces/{ws_id}/members", headers=owner["headers"])).json()
    me_flag = next(m for m in members if m["email"] == member["email"])
    assert me_flag["online"] is False

    # ping -> online
    r = await client.post("/api/v1/presence/ping", headers=member["headers"])
    assert r.status_code == 204
    members = (await client.get(f"/api/v1/workspaces/{ws_id}/members", headers=owner["headers"])).json()
    me_flag = next(m for m in members if m["email"] == member["email"])
    assert me_flag["online"] is True


async def test_team_chat_direct_group_and_permissions(client):
    owner = await _register_and_login(client)
    alice = await _register_and_login(client)
    bob = await _register_and_login(client)
    outsider = await _register_and_login(client)
    ws_id = await _workspace_with(client, owner, alice, bob)

    # DM between owner and alice
    dm = await client.post(
        f"/api/v1/workspaces/{ws_id}/team-chats/direct",
        json={"user_id": alice["id"]},
        headers=owner["headers"],
    )
    assert dm.status_code == 201, dm.text
    dm_id = dm.json()["id"]
    assert len(dm.json()["participants"]) == 2

    # creating same DM again returns the existing chat
    dm_again = await client.post(
        f"/api/v1/workspaces/{ws_id}/team-chats/direct",
        json={"user_id": alice["id"]},
        headers=owner["headers"],
    )
    assert dm_again.status_code == 200
    assert dm_again.json()["id"] == dm_id

    # cannot DM yourself
    r = await client.post(
        f"/api/v1/workspaces/{ws_id}/team-chats/direct",
        json={"user_id": owner["id"]},
        headers=owner["headers"],
    )
    assert r.status_code == 400

    # group chat needs >= 2 members
    r = await client.post(
        f"/api/v1/workspaces/{ws_id}/team-chats/group",
        json={"title": "Solo", "member_ids": [alice["id"]]},
        headers=owner["headers"],
    )
    assert r.status_code == 422

    grp = await client.post(
        f"/api/v1/workspaces/{ws_id}/team-chats/group",
        json={"title": "Launch prep", "member_ids": [alice["id"], bob["id"]]},
        headers=owner["headers"],
    )
    assert grp.status_code == 201, grp.text
    grp_id = grp.json()["id"]

    # bob sends message to group
    r = await client.post(
        f"/api/v1/team-chats/{grp_id}/messages",
        json={"content": "hello team"},
        headers=bob["headers"],
    )
    assert r.status_code == 201, r.text
    msg = r.json()
    assert msg["sender_id"] == bob["id"]

    # participants can read
    msgs = await client.get(f"/api/v1/team-chats/{grp_id}/messages", headers=alice["headers"])
    assert msgs.status_code == 200
    assert len(msgs.json()) == 1

    # outsider cannot read -> 404
    r = await client.get(f"/api/v1/team-chats/{grp_id}/messages", headers=outsider["headers"])
    assert r.status_code == 404

    # outsider not in workspace can't even create DM here -> 404
    r = await client.post(
        f"/api/v1/workspaces/{ws_id}/team-chats/direct",
        json={"user_id": alice["id"]},
        headers=outsider["headers"],
    )
    assert r.status_code == 404

    # listing team chats for bob includes both chats with previews
    lst = (await client.get(f"/api/v1/workspaces/{ws_id}/team-chats", headers=bob["headers"])).json()
    ids = {c["id"] for c in lst}
    assert grp_id in ids
    launch = next(c for c in lst if c["id"] == grp_id)
    assert launch["last_message_preview"] == "hello team"

    # docs_qa conversations must never appear in team chats
    conv = await client.post(f"/api/v1/workspaces/{ws_id}/conversations", json={}, headers=alice["headers"])
    lst2 = (await client.get(f"/api/v1/workspaces/{ws_id}/team-chats", headers=alice["headers"])).json()
    assert conv.json()["id"] not in {c["id"] for c in lst2}
