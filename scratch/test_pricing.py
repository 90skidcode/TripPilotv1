import requests

API_URL = "http://127.0.0.1:8000"

def test():
    # Login
    print("Attempting to login...")
    login_url = f"{API_URL}/auth/login"
    data = {
        "username": "admin@trippilot.com",
        "password": "password123"
    }
    response = requests.post(login_url, data=data)
    print("Login Status Code:", response.status_code)
    if response.status_code != 200:
        print("Login failed:", response.text)
        return
    
    token = response.json()["access_token"]
    print("Access token retrieved:", token[:20] + "...")

    # Fetch pricing plans
    plans_url = f"{API_URL}/pricing/plans/all"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    plans_response = requests.get(plans_url, headers=headers)
    print("Get Plans Status Code:", plans_response.status_code)
    if plans_response.status_code != 200:
        print("Failed to get plans:", plans_response.text)
        return
    
    plans = plans_response.json()
    print("Successfully retrieved plans:")
    for plan in plans:
        print(f"- ID: {plan['id']}, Name: {plan['name']}, Price: {plan['monthly_price']}, Active: {plan['is_active']}")

if __name__ == "__main__":
    test()
