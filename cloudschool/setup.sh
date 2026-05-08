#!/usr/bin/env bash
set -e

# ── CloudSchool local setup script ──────────────────────────────────────────
# Run this once from the cloudschool/ directory:
#   bash setup.sh
# ─────────────────────────────────────────────────────────────────────────────

CYAN='\033[0;36m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${CYAN}[setup]${NC} $1"; }
ok()    { echo -e "${GREEN}[done]${NC}  $1"; }
fail()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ── 1. Check Node ──
info "Checking Node.js..."
node -v &>/dev/null || fail "Node.js not found. Install from https://nodejs.org (v18+)"
NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
[ "$NODE_MAJOR" -ge 18 ] || fail "Node.js v18+ required (you have $(node -v))"
ok "Node.js $(node -v)"

# ── 2. Check PostgreSQL ──
info "Checking PostgreSQL..."
psql --version &>/dev/null || fail "psql not found. Install PostgreSQL from https://postgresql.org"
ok "$(psql --version)"

# ── 3. Install npm dependencies ──
info "Installing dependencies..."
npm install --silent
ok "Dependencies installed"

# ── 4. Create DB user + database ──
info "Setting up database..."
# Try to create user (ignore error if already exists)
psql postgres -c "CREATE USER cloudschool WITH PASSWORD 'cloudschool';" 2>/dev/null || true
psql postgres -c "CREATE DATABASE cloudschool OWNER cloudschool;" 2>/dev/null || true
ok "Database ready"

# ── 5. Write .env if not already present ──
if [ ! -f .env ] || ! grep -q "NEXTAUTH_SECRET" .env; then
  info "Writing .env..."
  SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")
  cat > .env <<EOF
DATABASE_URL="postgresql://cloudschool:cloudschool@localhost:5432/cloudschool"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${SECRET}"
EOF
  ok ".env written"
else
  ok ".env already exists"
fi

# ── 6. Run migrations ──
info "Running database migrations..."
npx prisma migrate deploy
ok "Migrations applied"

# ── 7. Seed demo data ──
info "Seeding demo data..."
npx tsx prisma/seed.ts
ok "Demo data seeded"

# ── 8. Done ──
echo ""
echo -e "${GREEN}────────────────────────────────────────${NC}"
echo -e "${GREEN} Setup complete! Start the app with:${NC}"
echo -e "${GREEN}   npm run dev${NC}"
echo -e "${GREEN}${NC}"
echo -e "${GREEN} Then open: http://localhost:3000${NC}"
echo -e "${GREEN} Login:     admin@demo.edu / admin123${NC}"
echo -e "${GREEN}────────────────────────────────────────${NC}"
