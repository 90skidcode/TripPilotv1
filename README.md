# Plannatrip — Travel Agency CRM

A multi-tenant SaaS CRM platform for travel agencies. Includes a staff-facing CRM frontend, a super-admin portal, and a FastAPI backend with AI integrations, WhatsApp/Instagram messaging, and subscription management.

---

## Architecture

| Service   | Technology             | Default Port |
|-----------|------------------------|--------------|
| Backend   | Python 3.12 + FastAPI  | 8000         |
| Frontend  | Next.js 16 (React 19)  | 3001         |
| Admin     | Next.js 16 (React 19)  | 3002         |
| Database  | MySQL 8.0 (Docker) or PostgreSQL (cloud) | 3306 |

---

## Prerequisites

- **Node.js** v20+
- **Python** 3.12+
- **Docker Desktop** (for the database and full-stack Docker mode)
- **Git**

---

## Option A — Run with Docker (recommended)

This starts all four services (MySQL, backend, frontend, admin) with a single command.

### 1. Clone the repository

```bash
git clone <repo-url>
cd Plannatrip
```

### 2. Create environment files

Copy the production template and fill in your values:

```bash
cp .env.production .env
```

Open `.env` and set at minimum:

```env
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_USER=plannatrip
MYSQL_PASSWORD=your_db_password
DATABASE_URL=mysql+pymysql://plannatrip:your_db_password@mysql:3306/plannatrip
BACKEND_SECRET_KEY=your_secret_key_at_least_32_chars
NEXT_PUBLIC_API_URL=http://localhost:8000
ADMIN_NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Build and start

```bash
docker compose up --build
```

Services will be available at:

- Frontend CRM: http://localhost:3000
- Admin Portal: http://localhost:3002
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

### 4. Stop

```bash
docker compose down
```

To also delete the database volume:

```bash
docker compose down -v
```

---

## Option B — Run each service locally

### 1. Clone the repository

```bash
git clone <repo-url>
cd Plannatrip
```

### 2. Start the database

Use Docker just for MySQL:

```bash
docker run -d \
  --name plannatrip-db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=plannatrip \
  -e MYSQL_USER=plannatrip \
  -e MYSQL_PASSWORD=plannatrip \
  -p 3306:3306 \
  mysql:8.0
```

Or point to an existing MySQL or PostgreSQL instance by setting `DATABASE_URL` accordingly.

---

### 3. Backend

```bash
cd backend
```

Create a virtual environment and install dependencies:

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://plannatrip:plannatrip@localhost:3306/plannatrip
SECRET_KEY=your_secret_key_at_least_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Optional AI integrations
GEMINI_API_KEY=
OPENAI_API_KEY=
```

Run database migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

---

### 4. Frontend (CRM)

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Available at: http://localhost:3001

---

### 5. Admin Portal

```bash
cd admin
```

Install dependencies:

```bash
npm install
```

Create `admin/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Available at: http://localhost:3002

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable                    | Description                                      | Required |
|-----------------------------|--------------------------------------------------|----------|
| `DATABASE_URL`              | SQLAlchemy connection string (MySQL or PostgreSQL) | Yes    |
| `SECRET_KEY`                | JWT signing secret (min 32 chars)                | Yes      |
| `ALGORITHM`                 | JWT algorithm (default: `HS256`)                 | Yes      |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime in minutes (default: `1440`)   | Yes      |
| `GEMINI_API_KEY`            | Google Gemini API key for AI features            | No       |
| `OPENAI_API_KEY`            | OpenAI API key for AI features                   | No       |

### Frontend (`frontend/.env.local`)

| Variable               | Description                        | Required |
|------------------------|------------------------------------|----------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL               | Yes      |

### Admin (`admin/.env.local`)

| Variable               | Description                        | Required |
|------------------------|------------------------------------|----------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL               | Yes      |

---

## Available Scripts

### Backend

| Command                        | Description                        |
|--------------------------------|------------------------------------|
| `uvicorn app.main:app --reload` | Start dev server with hot reload  |
| `alembic upgrade head`         | Apply all pending migrations       |
| `alembic revision --autogenerate -m "message"` | Generate a new migration |
| `alembic downgrade -1`         | Roll back the last migration       |

### Frontend & Admin

| Command         | Description                        |
|-----------------|------------------------------------|
| `npm run dev`   | Start development server           |
| `npm run build` | Build for production               |
| `npm run start` | Start production server            |
| `npm run lint`  | Run ESLint                         |

Run bundle analysis (frontend only):

```bash
cd frontend
npm run analyze
```

---

## Production Deployment

For production deployment using Docker:

```bash
docker compose -f docker-compose.production.yml up --build -d
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) and [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for full cloud deployment instructions.

---

## Project Structure

```
Plannatrip/
├── backend/                # FastAPI Python API
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── main.py         # App entrypoint
│   ├── alembic/            # Database migrations
│   └── requirements.txt
├── frontend/               # CRM Next.js app (port 3001)
│   ├── app/                # App Router pages
│   ├── components/         # Shared UI components
│   └── package.json
├── admin/                  # Admin portal Next.js app (port 3002)
│   ├── app/                # App Router pages
│   └── package.json
├── docker-compose.yml            # Local dev (all services)
└── docker-compose.production.yml # Production
```

---

## Key Features

- Multi-tenant architecture with organization-level data isolation
- Role-based access control (staff, manager, super-admin)
- Lead and customer management
- Trip itinerary builder
- Invoice and voucher generation
- WhatsApp and Instagram messaging integration
- AI-powered tools via OpenAI and Google Gemini
- Subscription plans with usage tracking
- B2B partner management
