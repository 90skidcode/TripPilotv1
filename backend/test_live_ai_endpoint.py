import requests

def main():
    base_url = "http://127.0.0.1:8000"
    
    # 1. Login to get token
    print("Logging in to backend...")
    login_data = {
        "username": "admin@trippilot.com",
        "password": "password123"
    }
    r = requests.post(f"{base_url}/auth/login", data=login_data)
    if r.status_code != 200:
        print(f"Login failed: {r.status_code} - {r.text}")
        return
        
    token = r.json()["access_token"]
    print("Login successful!")
    
    # 2. Call /leads/ai endpoint
    headers = {
        "Authorization": f"Bearer {token}"
    }
    payload = {
        "text": "Ram is planning a family trip to Switzerland for 7 days with a budget of ₹6 lakhs. Travelers include 2 adults and 2 kids. 9876543210."
    }
    print("\nPosting AI Lead Entry...")
    r = requests.post(f"{base_url}/leads/ai", json=payload, headers=headers)
    if r.status_code != 201:
        print(f"AI Lead Entry failed: {r.status_code} - {r.text}")
        return
        
    print("AI Lead Entry successful! Serialized JSON response:")
    import json
    print(json.dumps(r.json(), indent=4))

if __name__ == "__main__":
    main()
