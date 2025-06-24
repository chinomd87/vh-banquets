#!/bin/bash

# Quick Netlify Deployment for VH Banquets
echo "🚀 Quick Netlify Deployment Setup"
echo "=================================="
echo ""
echo "1. 🏗️  Building production version..."

# Build the app
npm run build:prod

echo ""
echo "2. 📦 Your app is built and ready!"
echo ""
echo "Next steps:"
echo "----------"
echo "1. Go to: https://netlify.com"
echo "2. Click 'Add new site' → 'Deploy manually'"
echo "3. Drag and drop your 'build' folder"
echo "4. Your site will be live instantly!"
echo ""
echo "For automatic deployments:"
echo "1. Go to: https://netlify.com"
echo "2. Click 'Add new site' → 'Import from Git'"
echo "3. Connect your GitHub account"
echo "4. Select 'vh-banquets' repository"
echo "5. Build command: npm run build:prod"
echo "6. Publish directory: build"
echo "7. Add custom domain: vhbanquets.com"
echo ""
echo "✅ Your VH Banquets app will be live at vhbanquets.com!"
