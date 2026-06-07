# Local Development Setup

This guide explains how to run TripPilot locally with all services on different ports, accessible only on localhost.

## Port Configuration

| Service | URL | Port | Access |
|---------|-----|------|--------|
| Backend API | http://127.0.0.1:8000 | 8000 | localhost only |
| Frontend App | http://localhost:3001 | 3001 | localhost only |
| Admin Portal | http://localhost:3002 | 3002 | localhost only |

## Prerequisites

- Python 3.12+
- Node.js 18+
- npm or yarn

## Running Services

### Terminal 1: Backend API

```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

✅ Backend ready at http://127.0.0.1:8000

### Terminal 2: Frontend Application

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend ready at http://localhost:3001

### Terminal 3: Admin Portal

```bash
cd admin
npm install
npm run dev
```

✅ Admin Portal ready at http://localhost:3002

## Access Points

### Main Application (Frontend)
- **URL:** http://localhost:3001
- **Purpose:** CRM for travel agents
- **Login:** Regular user credentials

### Admin Dashboard
- **URL:** http://localhost:3002
- **Purpose:** Superadmin management
- **Login:** `admin@trippilot.com` / `password123`

### API Documentation
- **URL:** http://127.0.0.1:8000/docs
- **Purpose:** Interactive API docs (Swagger UI)

## Environment Configuration

### Backend (.env)
No additional env vars needed. Uses defaults.

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Admin (.env.local)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Network Security

All services are configured to listen **only on localhost** (127.0.0.1):
- ✅ Not accessible from other machines on the network
- ✅ Secure for local development
- ✅ No network-based attacks possible locally
- ✅ Perfect for testing before deployment

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3001
kill -9 <PID>
```

### API Connection Issues
- Verify backend is running on http://127.0.0.1:8000
- Check `.env.local` files have correct API URL
- Clear browser cache and localStorage
- Check browser console for CORS errors

### Database Issues
- Backend automatically creates tables on startup
- Admin user created: `admin@trippilot.com` / `password123`
- Default organization: "Default Organization"

## Production Deployment

For production, update:
1. Backend host to `0.0.0.0` (accept all interfaces)
2. Frontend/Admin API URLs to production domain
3. CORS configuration in backend
4. Environment variables for database, secrets, etc.
