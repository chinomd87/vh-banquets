# Netlify Deployment Settings for VH Banquets

## Build Settings
- **Repository**: matthewdionisopoulos/vh-banquets
- **Branch**: main
- **Build command**: npm run build:prod
- **Publish directory**: build
- **Node version**: 20 (set in netlify.toml)

## Environment Variables (Add in Netlify Dashboard)
Navigate to: Site settings → Environment variables → Add variable

Required variables:
- REACT_APP_ENV = production
- REACT_APP_DOMAIN = vhbanquets.com
- REACT_APP_API_URL = https://api.vhbanquets.com
- GENERATE_SOURCEMAP = false

## Custom Domain Setup
1. Go to: Site settings → Domain management
2. Click "Add custom domain"
3. Enter: vhbanquets.com
4. Netlify will provide DNS instructions

## DNS Configuration (Point your domain to Netlify)
Add these records at your domain registrar:

### Option 1: CNAME (Recommended)
- Type: CNAME
- Name: @ (or leave blank)
- Value: [your-site-name].netlify.app

### Option 2: A Records
- Type: A
- Name: @ (or leave blank)
- Value: 75.2.60.5

- Type: A
- Name: @ (or leave blank)
- Value: 99.83.190.102

- Type: A
- Name: @ (or leave blank)
- Value: 198.61.251.14

- Type: A
- Name: @ (or leave blank)
- Value: 198.61.251.15

### WWW Subdomain
- Type: CNAME
- Name: www
- Value: [your-site-name].netlify.app

## SSL Certificate
- Automatically provided by Netlify (Let's Encrypt)
- Usually activates within 24 hours
- Forces HTTPS redirects

## Deployment Status
- ✅ Build successful
- ✅ Site deployed
- ✅ Custom domain configured
- ✅ SSL certificate active
- ✅ Performance optimized
