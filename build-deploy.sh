#!/bin/bash

# VH Banquets Production Build Script
# This script builds the app and prepares it for deployment to vhbanquets.com

set -e

echo "🏗️  Building VH Banquets for production..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build/
rm -rf deploy/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm test -- --coverage --watchAll=false

# Build for production
echo "🏗️  Building production bundle..."
GENERATE_SOURCEMAP=false npm run build:prod

# Create deployment directory
echo "📁 Creating deployment package..."
mkdir -p deploy

# Copy build files
cp -r build/* deploy/

# Copy .htaccess for traditional hosting
cp public/.htaccess deploy/

# Create deployment info
echo "📄 Creating deployment info..."
cat > deploy/deployment-info.txt << EOF
VH Banquets Deployment Information
=================================
Build Date: $(date)
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git rev-parse --abbrev-ref HEAD)
Node Version: $(node --version)
NPM Version: $(npm --version)

Deployment Instructions:
1. Upload all files from this deploy/ folder to your web server's public_html directory
2. Ensure your domain points to vhbanquets.com
3. Configure SSL certificate for HTTPS
4. Test the application at https://vhbanquets.com

Files included:
$(find deploy -type f | wc -l) files
$(du -sh deploy | cut -f1) total size
EOF

# Create a zip file for easy upload
echo "📦 Creating deployment package..."
cd deploy
zip -r ../vh-banquets-deployment-$(date +%Y%m%d-%H%M%S).zip ./*
cd ..

echo "✅ Build complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload the contents of the 'deploy/' folder to your web server"
echo "2. Or use the generated zip file for easy deployment"
echo "3. Configure your domain to point to vhbanquets.com"
echo "4. Set up SSL certificate"
echo ""
echo "🚀 Your VH Banquets app is ready for deployment to vhbanquets.com!"
