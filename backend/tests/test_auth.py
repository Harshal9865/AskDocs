import random
import string


def _email() -> str:
    return "user_" + "".join(random.choices(string.ascii_lowercase, k=10)) + "@test.dev"


async def test_register_login_me(client):
    email = _email()
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "secret123", "name": "Test User"},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["email"] == email

    # duplicate email -> 409
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "secret123", "name": "Dup"},
    )
    assert resp.status_code == 409

    # login (OAuth2 form)
    resp = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": "secret123"}
    )
    assert resp.status_code == 200, resp.text
    tokens = resp.json()
    assert "access_token" in tokens and "refresh_token" in tokens

    # bad password -> 401
    resp = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": "wrong"}
    )
    assert resp.status_code == 401

    # /me with access token
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    resp = await client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == email

    # refresh flow
    resp = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()

    # no token -> 401
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
