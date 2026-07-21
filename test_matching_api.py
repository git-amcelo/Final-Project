import requests
import json
import os

BASE_URL = "http://localhost:8000/api"

# Get a token to use for testing
def get_token():
    print("Getting token for testuser...")
    try:
        # First register a user
        res = requests.post(f"{BASE_URL}/register/", json={
            "username": "testuser_matching",
            "email": "testuser_matching@example.com",
            "password": "Password123!",
            "password_confirm": "Password123!"
        })
        
        # Then login
        res = requests.post(f"{BASE_URL}/token/", json={
            "username": "testuser_matching",
            "password": "Password123!"
        })
        if res.status_code == 200:
            return res.json().get("access")
        else:
            print(f"Failed to get token: {res.text}")
            return None
    except Exception as e:
        print(f"Error getting token: {e}")
        return None

token = get_token()
if not token:
    print("Cannot proceed without token")
    exit(1)

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# 1. Test Matching Preferences
print("\n--- Testing Matching Preferences ---")
res = requests.get(f"{BASE_URL}/matching/preferences/", headers=headers)
print(f"GET /matching/preferences/: {res.status_code}")
if res.status_code == 404:
    print("FAIL: Still getting 404!")

# 2. Test Top Matches
print("\n--- Testing Top Matches ---")
res = requests.get(f"{BASE_URL}/matching/top-matches/", headers=headers)
print(f"GET /matching/top-matches/: {res.status_code}")

# 3. Test Find Buddies
print("\n--- Testing Find Buddies ---")
res = requests.post(f"{BASE_URL}/matching/find-buddies/", headers=headers, json={"fitness_level": "intermediate"})
print(f"POST /matching/find-buddies/: {res.status_code}")

print("\nDone testing matching APIs.")
