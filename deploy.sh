#!/bin/bash
set -e

echo "=========================================="
echo "TripPilot SaaS Docker Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"

# Check environment files
ENV_FILE=".env.production.local"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found${NC}"
    echo "Please copy .env.production to .env.production.local and update it with your values"
    exit 1
fi

echo -e "${GREEN}✓ Environment file found${NC}"

# Parse environment
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Select deployment mode
echo ""
echo "Select deployment mode:"
echo "1) Development (docker-compose.yml)"
echo "2) Production (docker-compose.production.yml)"
read -p "Enter choice (1-2): " DEPLOY_MODE

case $DEPLOY_MODE in
    1)
        COMPOSE_FILE="docker-compose.yml"
        echo -e "${YELLOW}Using development configuration${NC}"
        ;;
    2)
        COMPOSE_FILE="docker-compose.production.yml"
        echo -e "${YELLOW}Using production configuration${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Stop existing containers
echo ""
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true

# Build images (development only)
if [ "$DEPLOY_MODE" = "1" ]; then
    echo -e "${YELLOW}Building images...${NC}"
    docker-compose -f "$COMPOSE_FILE" build
fi

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check health
echo ""
echo -e "${YELLOW}Checking service health...${NC}"
docker-compose -f "$COMPOSE_FILE" ps

# Display endpoints
echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "=========================================${NC}"
echo ""
echo "Services are running at:"
echo "  Backend API:    http://localhost:8000"
echo "  API Docs:       http://localhost:8000/docs"
echo "  Frontend:       http://localhost:3000"
echo "  Admin Portal:   http://localhost:3001"
echo "  Database:       localhost:3306"
echo ""
echo "View logs:"
echo "  All:     docker-compose -f $COMPOSE_FILE logs -f"
echo "  Backend: docker-compose -f $COMPOSE_FILE logs -f backend"
echo ""
echo "Stop services:"
echo "  docker-compose -f $COMPOSE_FILE down"
echo ""
