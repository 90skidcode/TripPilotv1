# API Troubleshooting Guide

**Error:** "Failed to fetch" when making API calls

## ✅ Quick Fixes (Try These First)

### 1. Verify Backend is Running
```bash
# Check if backend API is running on port 8000
curl http://127.0.0.1:8000/docs

# If you get "Connection refused", the backend is NOT running
# Start the backend server before continuing
```

### 2. Check API URL Configuration
```bash
# Verify .env.local has correct API URL
cat .env.local

# Should show:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 3. Restart Development Server
```bash
# If you changed .env.local, restart the dev server
npm run dev
# Ctrl+C to stop, then run again
```

### 4. Clear Cache
```bash
# Clear browser cache and local storage
# 1. Open DevTools (F12)
# 2. Application → Clear site data
# 3. Refresh page
```

---

## 📋 Checklist Before Running

- [ ] Backend server is running (port 8000)
- [ ] `.env.local` exists with `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
- [ ] Frontend development server is running (`npm run dev`)
- [ ] Browser is at `http://localhost:3000`
- [ ] No browser cache issues (clear if needed)

---

## 🔍 Debugging Steps

### Step 1: Check Backend Connection
```bash
# Test API endpoint directly
curl -X GET http://127.0.0.1:8000/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return user data or 401 (not "Failed to fetch")
```

### Step 2: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors with details
4. Check Network tab → XHR/Fetch calls
5. Click on failed request to see response

### Step 3: Check Environment Variables
```bash
# In DevTools Console, run:
console.log(process.env.NEXT_PUBLIC_API_URL)

# Should output: http://127.0.0.1:8000
```

### Step 4: Test Mock Request
```bash
# Add this to browser console to test
fetch('http://127.0.0.1:8000/health')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.log('Error:', e.message))
```

---

## 🚨 Common Issues & Solutions

### Issue: "Failed to fetch" but no other error
**Cause:** Backend not running or wrong port

**Solution:**
```bash
# Make sure backend is running
# Check backend README for startup instructions
# Verify it's listening on port 8000

netstat -an | grep 8000  # On Linux/Mac
netstat -ano | findstr :8000  # On Windows
```

### Issue: "Failed to fetch" with CORS error in DevTools
**Cause:** Backend CORS not configured

**Solution:**
```
Backend needs to allow requests from http://localhost:3000

In your backend settings/config:
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
```

### Issue: 401 Unauthorized (after "Failed to fetch")
**Cause:** Token is missing or invalid

**Solution:**
```bash
# Login first - go to /login page
# Use demo credentials: admin@trippilot.com / password123

# After login, token is stored in localStorage
# DevTools Console:
localStorage.getItem('trippilot_token')
```

### Issue: API returns 500 Internal Server Error
**Cause:** Backend issue

**Solution:**
```
Check backend logs for details
Backend may need database setup, migrations, etc.
See backend README for setup instructions
```

### Issue: Network shows request but fails with CORS
**Cause:** Backend CORS configuration

**Check backend has headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 🔧 Configuration Reference

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Backend needs to allow CORS for:
# - http://localhost:3000
# - http://127.0.0.1:3000
```

### API Request Headers
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"  // If authenticated
}
```

### Expected API Response Format
```json
{
  // Successful response (2xx)
  {
    "data": {}
  }

  // Error response (4xx, 5xx)
  {
    "detail": "Error message"
  }
}
```

---

## 📚 Files to Check

- **Frontend:** `lib/api.ts` — API client configuration
- **Frontend:** `.env.local` — Environment variables
- **Backend:** Setup/config files for CORS settings
- **Backend:** Database connection settings

---

## 🆘 Still Stuck?

### Checklist:
1. ✅ Backend is running on port 8000
2. ✅ `.env.local` has correct API URL
3. ✅ Frontend dev server restarted after env changes
4. ✅ Browser cache cleared
5. ✅ No firewall blocking localhost connections

### Debug Mode:
```javascript
// Add to lib/api.ts temporarily for debugging:
console.log(`API Request: ${API_URL}${path}`);
console.log(`Token: ${token ? 'Present' : 'Missing'}`);

// Then check browser console for details
```

### Get Help:
1. Check backend logs for errors
2. Verify backend is actually listening: `curl http://127.0.0.1:8000`
3. Test with curl command in terminal
4. Check firewall/network settings
5. Try with explicit IP instead of localhost

---

## ✨ Working Setup Should Look Like:

### Terminal 1 - Backend
```bash
$ python manage.py runserver 8000
# Listening on http://127.0.0.1:8000
```

### Terminal 2 - Frontend
```bash
$ npm run dev
# Listening on http://localhost:3000
```

### Browser
```
http://localhost:3000
↓
Shows login page (no "Failed to fetch" error)
↓
Login with credentials
↓
Redirects to /dashboard
↓
Data loads successfully
```

---

## 📖 Related Documentation

- See `.claude.md` → "Debugging" section for more troubleshooting
- See `ARCHITECTURE.md` → "API Integration" for details
- Backend API documentation (in backend README)

---

**Last Updated:** May 23, 2026
