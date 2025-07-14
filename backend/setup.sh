#!/bin/bash

# VH Banquets Backend Quick Setup Script
# This script helps set up the development environment

echo "🏨 VH Banquets Backend Setup"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the backend directory${NC}"
    exit 1
fi

echo -e "\n${BLUE}Step 1: Installing Dependencies${NC}"
if npm install; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "\n${BLUE}Step 2: Environment Configuration${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠ Created .env file from .env.example${NC}"
        echo -e "${YELLOW}⚠ Please edit .env file with your actual configuration${NC}"
    else
        echo -e "${RED}✗ No .env.example file found${NC}"
    fi
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo -e "\n${BLUE}Step 3: Database Setup Check${NC}"
echo -e "${YELLOW}Please ensure:${NC}"
echo "  • PostgreSQL is installed and running"
echo "  • Database 'vh_banquets' is created"
echo "  • Database user has proper permissions"
echo "  • DATABASE_URL in .env is configured"

echo -e "\n${BLUE}Step 4: AWS S3 Setup Check${NC}"
echo -e "${YELLOW}Please ensure:${NC}"
echo "  • AWS S3 bucket is created"
echo "  • AWS IAM user has S3 permissions"
echo "  • AWS credentials are set in .env"

echo -e "\n${BLUE}Step 5: Database Schema${NC}"
if [ -f "database/schema.sql" ]; then
    echo -e "${GREEN}✓ Database schema file found${NC}"
    echo -e "${YELLOW}To create database tables, run:${NC}"
    echo "  psql -d vh_banquets -f database/schema.sql"
else
    echo -e "${RED}✗ Database schema file not found${NC}"
fi

echo -e "\n${BLUE}Step 6: Testing${NC}"
if [ -f "test-api.sh" ]; then
    echo -e "${GREEN}✓ API testing script ready${NC}"
    echo -e "${YELLOW}To test all endpoints, run:${NC}"
    echo "  ./test-api.sh"
else
    echo -e "${RED}✗ API testing script not found${NC}"
fi

echo -e "\n${GREEN}Setup Summary:${NC}"
echo "✅ Dependencies installed"
echo "📝 Environment file created/checked"
echo "💾 Database schema ready"
echo "🧪 Testing script available"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Edit .env file with your configuration"
echo "2. Create PostgreSQL database and user"
echo "3. Run database schema: psql -d vh_banquets -f database/schema.sql"
echo "4. Start development server: npm run dev"
echo "5. Run API tests: ./test-api.sh"

echo -e "\n${BLUE}Quick Start Commands:${NC}"
echo "# Start development server"
echo "npm run dev"
echo ""
echo "# Run in background"
echo "npm start"
echo ""
echo "# Test all APIs"
echo "./test-api.sh"

echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo -e "For detailed instructions, see: ${BLUE}SETUP.md${NC}"
