"""Manual smoke test for the matching API.

Run this module directly while the Django development server is running:

    python test_matching_api.py

The main guard is intentional so Django/unittest discovery can safely import
this module without making network requests or terminating the test process.
"""

import requests


BASE_URL = "http://localhost:8000/api"


def get_token():
    """Create the smoke-test user if needed and return an access token."""
    print("Getting token for testuser...")
    try:
        requests.post(
            f"{BASE_URL}/register/",
            json={
                "username": "testuser_matching",
                "email": "testuser_matching@example.com",
                "password": "Password123!",
                "password_confirm": "Password123!",
            },
            timeout=10,
        )
        response = requests.post(
            f"{BASE_URL}/token/",
            json={
                "username": "testuser_matching",
                "password": "Password123!",
            },
            timeout=10,
        )
        if response.status_code == 200:
            return response.json().get("access")

        print(f"Failed to get token: {response.text}")
    except requests.RequestException as exc:
        print(f"Error getting token: {exc}")
    return None


def main():
    token = get_token()
    if not token:
        print("Cannot proceed without token")
        return 1

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    print("\n--- Testing Matching Preferences ---")
    response = requests.get(
        f"{BASE_URL}/matching/preferences/",
        headers=headers,
        timeout=10,
    )
    print(f"GET /matching/preferences/: {response.status_code}")

    print("\n--- Testing Top Matches ---")
    response = requests.get(
        f"{BASE_URL}/matching/top-matches/",
        headers=headers,
        timeout=10,
    )
    print(f"GET /matching/top-matches/: {response.status_code}")

    print("\n--- Testing Find Buddies ---")
    response = requests.post(
        f"{BASE_URL}/matching/find-buddies/",
        headers=headers,
        json={"fitness_level": "intermediate"},
        timeout=10,
    )
    print(f"POST /matching/find-buddies/: {response.status_code}")

    print("\nDone testing matching APIs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
