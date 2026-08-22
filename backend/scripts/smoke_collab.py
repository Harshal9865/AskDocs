"""Live smoke test: invite -> notification -> accept -> presence -> DM -> group."""
import asyncio
import random
import string

import httpx

BASE = "http://localhost:8000/api/v1"


async def make_user(c):
    email = "collab_" + "".join(random.choices(string.ascii_lowercase, k=8)) + "@t.dev"
    await c.post(f"{BASE}/auth/register", json={"email": email, "password": "secret123", "name": email[:12]})
    r = await c.post(f"{BASE}/auth/login", data={"username": email, "password": "secret123"})
    return {
        "email": email,
        "headers": {"Authorization": "Bearer " + r.json()["access_token"]},
        "id": (await c.get(f"{BASE}/auth/me", headers={"Authorization": "Bearer " + r.json()["access_token"]})).json()["id"],
    }


async def main():
    async with httpx.AsyncClient(timeout=60) as c:
        owner, alice, bob = await make_user(c), await make_user(c), await make_user(c)
        ws = (await c.post(f"{BASE}/workspaces", json={"name": "CollabWS"}, headers=owner["headers"])).json()
        ws_id = ws["id"]

        # owner invites both; neither is a member yet
        for u in (alice, bob):
            r = await c.post(
                f"{BASE}/workspaces/{ws_id}/members",
                json={"email": u["email"], "role": "member"},
                headers=owner["headers"],
            )
            assert r.status_code == 201, r.text
        # alice not member yet: members list 404
        assert (await c.get(f"{BASE}/workspaces/{ws_id}/members", headers=alice["headers"])).status_code == 404
        print("[1] invitation created, invitee NOT auto-joined")

        # alice sees pending invitation and accepts
        invites = (await c.get(f"{BASE}/invitations", headers=alice["headers"])).json()
        target = next(i for i in invites if i["workspace_id"] == ws_id)
        prev = (await c.get(f"{BASE}/invitations/{target['id']}/workspace", headers=alice["headers"])).json()
        print("[2] preview:", prev)
        acc = await c.post(f"{BASE}/invitations/{target['id']}/accept", headers=alice["headers"])
        assert acc.status_code == 200
        print("[3] accepted")

        # bob pings presence -> shows online
        await c.post(f"{BASE}/presence/ping", headers=bob["headers"])
        # alice must accept too before listing
        inv2 = next(i for i in (await c.get(f"{BASE}/invitations", headers=bob["headers"])).json() if i["workspace_id"] == ws_id)
        await c.post(f"{BASE}/invitations/{inv2['id']}/accept", headers=bob["headers"])
        members = (await c.get(f"{BASE}/workspaces/{ws_id}/members", headers=owner["headers"])).json()
        flags = {m["email"]: m["online"] for m in members}
        print("[4] online flags:", {k.split('_')[0]: v for k, v in flags.items()})
        assert any(v is True for v in flags.values()), "no one shows online"

        # DM owner <-> alice
        dm = await c.post(
            f"{BASE}/workspaces/{ws_id}/team-chats/direct",
            json={"user_id": alice["id"]},
            headers=owner["headers"],
        )
        assert dm.status_code == 201, dm.text
        dm_id = dm.json()["id"]
        # repeat returns same chat with 200
        dm2 = await c.post(
            f"{BASE}/workspaces/{ws_id}/team-chats/direct",
            json={"user_id": alice["id"]},
            headers=owner["headers"],
        )
        assert dm2.status_code == 200 and dm2.json()["id"] == dm_id
        print("[5] DM created, dedupe works")

        await c.post(f"{BASE}/team-chats/{dm_id}/messages", json={"content": "hi Alice!"}, headers=owner["headers"])
        msgs = (await c.get(f"{BASE}/team-chats/{dm_id}/messages", headers=alice["headers"])).json()
        assert len(msgs) == 1 and msgs[0]["content"] == "hi Alice!"
        print("[6] DM message delivered")

        grp = await c.post(
            f"{BASE}/workspaces/{ws_id}/team-chats/group",
            json={"title": "Standup", "member_ids": [owner["id"], alice["id"], bob["id"]]},
            headers=bob["headers"],
        )
        assert grp.status_code == 201, grp.text
        chats = (await c.get(f"{BASE}/workspaces/{ws_id}/team-chats", headers=alice["headers"])).json()
        previews = {(ch['title'], ch['last_message_preview']) for ch in chats}
        print("[7] group created; alice's chat list:", previews)

        print("\n[SMOKE PASS]")


asyncio.run(main())
