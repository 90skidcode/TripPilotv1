# TripPilot SaaS — Complete Deployment Guide

Comprehensive guide for deploying TripPilot SaaS to production using Docker.

---

## Table of Contents

1. [Local Development](#local-development)
2. [Production Deployment](#production-deployment)
3. [Cloud Platforms](#cloud-platforms)
4. [Monitoring & Maintenance](#monitoring--maintenance)
5. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git
- 4GB+ RAM
- 20GB disk space

### Setup (5 minutes)

1. **Clone repository**
   ```bash
   git clone https://github.com/your-org/trippilot.git
   cd trippilot
   ```

2. **Create environment file**
   ```bash
   cp .env.production .env.local
   ```

3. **Update with local values** (optional for dev)
   ```env
   MYSQL_ROOT_PASSWORD=dev_password
   MYSQL_PASSWORD=dev_password
   BACKEND_SECRET_KEY=dev-secret-key-min-32-characters
   ```

4. **Start services**
   
   **On Linux/macOS:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   # Choose option 1 (Development)
   ```

   **On Windows:**
   ```bash
   deploy.bat
   # Choose option 1 (Development)
   ```

   **Or manually:**
   ```bash
   docker-compose up --build
   ```

5. **Access services**
   - Frontend: http://localhost:3000
   - Admin: http://localhost:3001
   - API: http://localhost:8000/docs
   - Database: mysql://localhost:3306/trippilot

### Default Credentials

- **Tenant CRM Login:** admin@trippilot.com / password123
- **Admin Portal:** admin@trippilot.com / password123
- **Database:** 
  - User: trippilot_user
  - Password: (from .env file)
  - Database: trippilot

### Stopping Services

```bash
docker-compose down          # Stop but keep volumes
docker-compose down -v       # Stop and remove volumes
```

### Viewing Logs

```bash
docker-compose logs -f                    # All services
docker-compose logs -f backend            # Specific service
docker-compose logs -f --tail 100 backend # Last 100 lines
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Server with Docker/Docker Compose installed
- [ ] Domain name configured (DNS A record)
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] Database backup strategy planned
- [ ] Monitoring tools set up
- [ ] Load balancing configured (optional)
- [ ] All passwords changed from defaults

### Step 1: Prepare Server

```bash
# SSH into your server
ssh root@your-server.com

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone & Configure

```bash
# Clone repository
git clone https://github.com/your-org/trippilot.git
cd trippilot

# Create production environment file
cp .env.production .env.production.local

# Edit with secure values
nano .env.production.local
```

**Critical settings to change:**

```env
# Generate with: openssl rand -base64 32
MYSQL_ROOT_PASSWORD=<generate-new-password>
MYSQL_PASSWORD=<generate-new-password>
BACKEND_SECRET_KEY=<generate-64-char-secret>

# Set your domain
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Step 3: Deploy Using Script

```bash
chmod +x deploy.sh
./deploy.sh
# Choose option 2 (Production)
```

Or manually:

```bash
docker-compose -f docker-compose.production.yml up -d
```

### Step 4: Configure Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/trippilot`:

```nginx
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

upstream admin {
    server localhost:3001;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main API
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTPS - Tenant CRM
server {
    listen 443 ssl;
    server_name crm.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/crm.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# HTTPS - Admin Portal
server {
    listen 443 ssl;
    server_name admin.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and test:

```bash
ln -s /etc/nginx/sites-available/trippilot /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 5: SSL Certificates with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx

# Get certificates
sudo certbot certonly --nginx \
  -d api.yourdomain.com \
  -d crm.yourdomain.com \
  -d admin.yourdomain.com
```

### Step 6: Verify Deployment

```bash
# Check container status
docker-compose -f docker-compose.production.yml ps

# Test endpoints
curl https://api.yourdomain.com/docs
curl https://crm.yourdomain.com
curl https://admin.yourdomain.com

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Step 7: Setup Backups

Create backup script `/opt/trippilot/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/trippilot"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec trippilot-mysql mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD} \
  --all-databases \
  > $BACKUP_DIR/backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql.gz"
```

Schedule daily backup:

```bash
chmod +x /opt/trippilot/backup.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/trippilot/backup.sh") | crontab -
```

---

## Cloud Platforms

### AWS Deployment (ECS)

1. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name trippilot
   ```

2. **Push images to ECR**
   ```bash
   aws ecr create-repository --repository-name trippilot-backend
   aws ecr create-repository --repository-name trippilot-frontend
   aws ecr create-repository --repository-name trippilot-admin
   
   docker tag trippilot-backend:latest $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/trippilot-backend
   docker push $ACCOUNT.dkr.ecr.$REGION.amazonaws.com/trippilot-backend
   ```

3. **Create RDS Database**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier trippilot-mysql \
     --db-instance-class db.t3.micro \
     --engine mysql \
     --master-username admin
   ```

4. **Deploy services to ECS** (use Cloudformation or Terraform)

### Google Cloud Deployment (Cloud Run)

```bash
# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Deploy backend
gcloud run deploy trippilot-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Deployment (Container Instances)

```bash
# Create resource group
az group create \
  --name trippilot \
  --location eastus

# Deploy with Docker Compose
az container create \
  --resource-group trippilot \
  --file docker-compose.production.yml
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check all services
docker-compose ps

# Check specific service
docker inspect trippilot-backend | grep Health

# Monitor logs
docker-compose logs -f
```

### Database Maintenance

```bash
# Optimize tables
docker exec trippilot-mysql mysql -u root -p${MYSQL_PASSWORD} \
  -e "OPTIMIZE TABLE trippilot.*;"

# Check database size
docker exec trippilot-mysql mysql -u root -p${MYSQL_PASSWORD} \
  -e "SELECT table_name, round(((data_length + index_length) / 1024 / 1024), 2) FROM information_schema.TABLES WHERE table_schema = 'trippilot';"
```

### Scaling Services

```bash
# For Kubernetes
kubectl scale deployment trippilot-backend --replicas=5

# For Docker Swarm
docker service scale trippilot_backend=5
```

### Performance Monitoring

Monitor key metrics:
- CPU usage
- Memory usage
- Disk I/O
- Database query time
- API response time
- Error rate

Use tools: Prometheus, Grafana, New Relic, DataDog

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs trippilot-backend

# Validate environment file
docker-compose config

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database connection errors

```bash
# Test database connectivity
docker exec trippilot-backend \
  python -c "import sqlalchemy; print('OK')"

# Check MySQL
docker exec trippilot-mysql \
  mysql -u root -p${MYSQL_PASSWORD} -e "SELECT 1"
```

### High memory usage

```bash
# Check container memory
docker stats

# Limit memory in docker-compose
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

### Port conflicts

```bash
# Find process using port
sudo lsof -i :8000

# Change port mapping
# ports:
#   - "8001:8000"
```

### Slow database queries

```bash
# Enable query logging
docker exec trippilot-mysql mysql -u root -p${MYSQL_PASSWORD} \
  -e "SET GLOBAL slow_query_log = 'ON';"

# Check slow log
docker exec trippilot-mysql tail -f /var/log/mysql/slow.log
```

---

## Support & Resources

- **Documentation:** https://docs.trippilot.com
- **Docker Docs:** https://docs.docker.com
- **Docker Compose:** https://docs.docker.com/compose
- **Issues:** https://github.com/your-org/trippilot/issues
- **Email:** support@trippilot.com

---

*Last Updated: 2026-05-19*  
*Version: 1.0*  
*Status: Production Ready*
