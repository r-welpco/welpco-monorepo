#!/bin/bash
set -e

echo "🚀 Setting up Welpco development environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo -e "${BLUE}📦 Starting Docker services (PostgreSQL + MailHog)...${NC}"
cd "$(dirname "$0")/.."
docker-compose up -d

echo -e "${BLUE}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 3

# Wait for PostgreSQL to be ready
echo -e "${BLUE}🔍 Checking PostgreSQL...${NC}"
until docker exec welpco-postgres pg_isready -U welpco -d welpco_dev > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

echo -e "${BLUE}📥 Installing dependencies (pnpm install)...${NC}"
pnpm install

# Create .env.local for BFF (single backend) if it doesn't exist
if [ ! -f "apps/bff/.env.local" ]; then
    echo -e "${BLUE}📝 Creating apps/bff/.env.local...${NC}"
    if [ -f "apps/bff/.env.example" ]; then
        cp apps/bff/.env.example apps/bff/.env.local
    else
        cat > apps/bff/.env.local << 'EOF'
# Database (single backend uses welpco_dev)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=welpco
DB_PASSWORD=welpco_dev
DB_DATABASE=welpco_dev

# JWT
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Geocoding (BFF fails on startup if empty; replace with a real key for address features)
GOOGLE_MAPS_API_KEY=local-dev-placeholder

# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1
FRONTEND_URL=http://localhost:8081

# Email — Mailpit (docker-compose). Web UI: http://localhost:8025
SMTP_HOST=localhost
SMTP_PORT=1025

# Object storage — MinIO (docker-compose). Console: http://localhost:9001
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=welpco-dev
AWS_ACCESS_KEY_ID=welpco_minio
AWS_SECRET_ACCESS_KEY=welpco_minio_dev
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL=http://localhost:9000
EOF
    fi
    echo -e "${GREEN}✅ Created apps/bff/.env.local${NC}"
fi

# Ensure Google Maps key is non-empty so Nest can boot (see GoogleMapsGeocodeService.onModuleInit)
if ! grep -qE '^GOOGLE_MAPS_API_KEY=.' apps/bff/.env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Adding GOOGLE_MAPS_API_KEY placeholder to apps/bff/.env.local (required for BFF startup).${NC}"
    printf '\n# Required for BFF startup; use a real key from Google Cloud for geocoding.\nGOOGLE_MAPS_API_KEY=local-dev-placeholder\n' >> apps/bff/.env.local
fi

# Create web .env.local for Next.js if missing (NextAuth + API URL)
if [ ! -f "apps/web/.env.local" ] && [ -f "apps/web/.env.example" ]; then
    echo -e "${BLUE}📝 Creating apps/web/.env.local from example...${NC}"
    cp apps/web/.env.example apps/web/.env.local
    echo -e "${GREEN}✅ Created apps/web/.env.local${NC}"
fi

echo -e "${BLUE}📐 Running database migrations...${NC}"
pnpm --filter @welpco/bff migration:run

echo -e "${BLUE}🌱 Seeding database...${NC}"
pnpm seed:users

echo -e "${GREEN}✅ Development environment is ready!${NC}"
echo ""
echo -e "${BLUE}📚 Next steps:${NC}"
echo "   1. Start the single backend + web:"
echo "      ${YELLOW}pnpm dev${NC}"
echo "   2. Or start with pretty logs:"
echo "      ${YELLOW}pnpm dev:pretty${NC}"
echo ""
echo "   3. Access:"
echo "      ${YELLOW}Backend API / Swagger: http://localhost:3000/api/docs${NC}"
echo "      ${YELLOW}Web: http://localhost:8081 (Next dev port in apps/web/package.json)${NC}"
echo ""
echo "   4. Test accounts (after seed):"
echo "      ${YELLOW}Customer: customer@welpco.com / Customer123!${NC}"
echo "      ${YELLOW}Welper: welper@welpco.com / Welper123!${NC}"
echo ""
