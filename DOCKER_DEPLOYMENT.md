# Docker Deployment Guide — TripPilot SaaS

This guide covers containerization and deployment of the complete TripPilot SaaS platform.

---

## Overview

The platform consists of 4 containerized services:
1. **Backend** — FastAPI (port 8000)
2. **Frontend** — Next.js Tenant CRM (port 3000)
3. **Admin** — Next.js Super Admin Portal (port 3001)
4. **MySQL** — Database (port 3306)

All services are orchestrated via Docker Compose.

---

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Linux/macOS or Windows with Docker Desktop
- Minimum 4GB RAM, 2 CPU cores

## Quick Start (Local Development)

### 1. Clone & Setup

```bash
cd /path/to/trippilot
git clone <repo> .
```

### 2. Create Environment File

```bash
cp .env.production .env.local
# Edit .env.local with local values (use simple passwords for dev)
```

### 3. Build & Start

```bash
docker-compose up --build
```

This will:
- Build all Docker images
- Start MySQL, Backend, Frontend, and Admin
- Initialize database automatically
- Display logs from all services

### 4. Access Services

- **Tenant CRM**: http://localhost:3000
- **Admin Portal**: http://localhost:3001
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:3306

### 5. Stop Services

```bash
docker-compose down
```

To also remove volumes (database data):
```bash
docker-compose down -v
```

---

## Production Deployment

### 1. Environment Configuration

Create `.env.production.local` with production values:

```env
# Change all passwords and secrets!
MYSQL_ROOT_PASSWORD=<strong-random-password>
MYSQL_PASSWORD=<strong-random-password>
BACKEND_SECRET_KEY=<64-char-random-string>

# Domain configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
FRONTEND_URL=https://crm.yourdomain.com
ADMIN_URL=https://admin.yourdomain.com
```

### 2. SSL/TLS Setup

Use nginx reverse proxy with Let's Encrypt:

```yaml
# Add to docker-compose.yml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./ssl:/etc/nginx/ssl:ro
  depends_on:
    - backend
    - frontend
    - admin
```

### 3. Database Backup

```bash
# Backup database
docker exec trippilot-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} \
  trippilot > backup.sql

# Restore database
docker exec -i trippilot-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} \
  trippilot < backup.sql
```

### 4. Multi-Stage Build (Optimization)

Dockerfiles use multi-stage builds to:
- Reduce image sizes
- Improve security (no source code in production)
- Faster deployments

Backend image: ~250MB → Production: ~100MB  
Frontend image: ~500MB → Production: ~80MB

### 5. Health Checks

All containers have health checks:

```bash
# View health status
docker-compose ps

# Check specific service
docker inspect trippilot-backend
```

---

## Kubernetes Deployment

### 1. Create Kubernetes Manifests

```bash
# deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trippilot-backend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: backend
        image: trippilot-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: trippilot-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /docs
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /docs
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
```

### 2. Deploy to Kubernetes

```bash
# Create secrets
kubectl create secret generic trippilot-secrets \
  --from-literal=database-url=<value>

# Apply manifests
kubectl apply -f deployment.yml
kubectl apply -f service.yml
kubectl apply -f ingress.yml

# Scale services
kubectl scale deployment trippilot-backend --replicas=5
```

---

## Cloud Providers

### AWS Deployment

```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag trippilot-backend:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/trippilot-backend:latest

docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/trippilot-backend:latest

# Deploy via ECS or EKS
aws ecs create-service --cluster trippilot \
  --service-name backend --task-definition trippilot-backend
```

### Google Cloud Deployment

```bash
# Configure Docker
gcloud auth configure-docker gcr.io

# Tag and push
docker tag trippilot-backend:latest \
  gcr.io/project-id/trippilot-backend:latest

docker push gcr.io/project-id/trippilot-backend:latest

# Deploy to Cloud Run
gcloud run deploy trippilot-backend \
  --image gcr.io/project-id/trippilot-backend:latest \
  --platform managed \
  --region us-central1
```

### Azure Deployment

```bash
# Login to ACR
az acr login --name trippilotregistry

# Tag and push
docker tag trippilot-backend:latest \
  trippilotregistry.azurecr.io/trippilot-backend:latest

docker push trippilotregistry.azurecr.io/trippilot-backend:latest

# Deploy to Container Instances
az container create \
  --resource-group trippilot \
  --name backend \
  --image trippilotregistry.azurecr.io/trippilot-backend:latest
```

---

## Monitoring & Logging

### Docker Compose Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail 100 backend

# Timestamps
docker-compose logs -f -t backend
```

### Prometheus Monitoring

Add to docker-compose.yml:

```yaml
prometheus:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
```

### ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
  ports:
    - "9200:9200"

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
```

---

## Performance Optimization

### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Caching Strategy

- Frontend: Nginx caching + CDN
- Backend: Redis for session/cache
- Database: Query optimization + indexes

### Load Balancing

```yaml
# nginx.conf
upstream backend {
  server trippilot-backend:8000;
  server trippilot-backend-2:8000;
  server trippilot-backend-3:8000;
}
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate random SECRET_KEY (min 32 chars)
- [ ] Use HTTPS/TLS in production
- [ ] Set restrictive CORS origins
- [ ] Enable database encryption
- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- [ ] Regular security updates
- [ ] Network policies/security groups
- [ ] Audit logging enabled
- [ ] DDoS protection (CloudFlare, AWS WAF)

---

## Troubleshooting

### Container fails to start

```bash
# Check logs
docker logs trippilot-backend

# Check health
docker inspect --format='{{.State.Health.Status}}' trippilot-backend

# Rebuild
docker-compose down
docker-compose up --build
```

### Database connection errors

```bash
# Verify MySQL is running
docker exec trippilot-mysql mysql -u root -p -e "SELECT 1"

# Check network
docker network ls
docker network inspect trippilot-network
```

### Port already in use

```bash
# Find process using port
lsof -i :8000

# Change docker-compose port mapping
# ports:
#   - "8001:8000"  # Changed from 8000
```

### Out of disk space

```bash
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database backup strategy in place
- [ ] SSL/TLS certificates ready
- [ ] Monitoring and logging configured
- [ ] Backups automated and tested
- [ ] Health checks passing
- [ ] Performance tested under load
- [ ] Security audit completed
- [ ] Disaster recovery plan documented
- [ ] Team trained on runbooks

---

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build images
        run: docker-compose build
      
      - name: Push to registry
        run: |
          docker login -u ${{ secrets.DOCKER_USERNAME }} \
            -p ${{ secrets.DOCKER_PASSWORD }}
          docker-compose push
      
      - name: Deploy to production
        run: |
          ssh -i ${{ secrets.SSH_KEY }} user@server \
            'cd /app && docker-compose pull && docker-compose up -d'
```

---

## Support

For deployment issues or questions:
- Check logs: `docker-compose logs`
- Review: DOCKER_DEPLOYMENT.md (this file)
- Common issues: #deployment channel on Slack
- Documentation: https://docs.trippilot.com

---

*Last Updated: 2026-05-19*  
*Ready for Production Deployment*
