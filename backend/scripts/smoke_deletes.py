import asyncio
import random
import string

import httpx

BASE = "http://localhost:8000/api/v1"


async def make_user(c):
    email = "del_" + "".join(random.choices(string.ascii_lowercase, k=8)) + "@t.dev"
    await c.post(f"{BASE}/auth/register", json={"email": email, "password": "secret123", "name": "U"})
    r = await c.post(f"{BASE}/auth/login", data={"username": email, "password": "secret123"})
    return {"email": email, "headers": {"Authorization": "Bearer " + r.json()["access_token"]}}


async def main():
    async with httpx.AsyncClient(timeout=60) as c:
        owner, member = await make_user(c), await make_user(c)
        ws = (await c.post(f"{BASE}/workspaces", json={"name": "DelTest"}, headers=owner["headers"])).json()
        await c.post(
            f"{BASE}/workspaces/{ws['id']}/members",
            json={"email": member["email"], "role": "member"},
            headers=owner["headers"],
        )
        conv = (await c.post(f"{BASE}/workspaces/{ws['id']}/conversations", json={}, headers=member["headers"])).json()
        print("conv has user_id:", "user_id" in conv)

        r = await c.delete(f"{BASE}/conversations/{conv['id']}", headers=member["headers"])
        print("owner delete own:", r.status_code)

        conv = (await c.post(f"{BASE}/workspaces/{ws['id']}/conversations", json={}, headers=member["headers"])).json()
        r = await c.delete(f"{BASE}/conversations/{conv['id']}", headers=owner["headers"])
        print("admin delete others:", r.status_code)

        r = await c.delete(f"{BASE}/workspaces/{ws['id']}", headers=owner["headers"])
        print("ws delete by admin:", r.status_code)
        lst = (await c.get(f"{BASE}/workspaces", headers=member["headers"])).json()
        print("ws gone from member list:", all(w["id"] != ws["id"] for w in lst))


asyncio.run(main())
