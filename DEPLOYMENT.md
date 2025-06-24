# VH Banquets Deployment Guide

## Hosting Options for vhbanquets.com

### Option 1: Static Hosting (Recommended for React SPA)
- **Netlify** - Easy deployment with CI/CD
- **Vercel** - Optimized for React apps
- **AWS S3 + CloudFront** - Scalable and cost-effective
- **GitHub Pages** - Free for public repos

### Option 2: Server-based Hosting
- **DigitalOcean App Platform**
- **Heroku**
- **AWS EC2 + Load Balancer**
- **Traditional web hosting with cPanel**

## Quick Deployment Steps

### For Static Hosting (Netlify/Vercel):
1. Build the production app: `npm run build:prod`
2. Deploy the `build` folder contents
3. Configure domain settings to point to vhbanquets.com

### For cPanel/Traditional Hosting:
1. Build the app: `npm run build:prod`
2. Upload `build` folder contents to your domain's public_html
3. Configure .htaccess for single-page app routing

### For Docker Deployment:
1. Use the existing Dockerfile
2. Deploy with docker-compose
3. Configure reverse proxy (nginx) for domain routing

## Domain Configuration
- Point vhbanquets.com to your hosting provider
- Configure SSL certificate
- Set up redirects (www to non-www or vice versa)

## Environment Setup
- Copy .env.production to your hosting environment
- Update API_URL to your backend endpoint
- Configure any analytics or tracking codes

## Performance Optimization
- Enable gzip compression
- Configure CDN for static assets
- Set up proper caching headers
- Optimize images and fonts
