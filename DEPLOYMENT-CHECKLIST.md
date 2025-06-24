# VH Banquets Deployment Checklist for vhbanquets.com

## Pre-Deployment Checklist

### ✅ Domain & Hosting Setup

- [ ] Domain vhbanquets.com is registered and pointing to your hosting provider
- [ ] SSL certificate is installed and configured
- [ ] DNS records are properly configured (A record, CNAME, etc.)
- [ ] Backup of existing site (if any) is created

### ✅ Application Build

- [ ] Production build completes successfully (`npm run build:prod`)
- [ ] All tests pass (`npm test`)
- [ ] Environment variables are configured in `.env.production`
- [ ] Security headers are properly configured

### ✅ Deployment Method Selection

#### Option A: Traditional Web Hosting (cPanel/FTP)

- [ ] Run `./build-deploy.sh` to create deployment package
- [ ] Upload contents of `deploy/` folder to `public_html`
- [ ] Verify `.htaccess` file is uploaded for SPA routing
- [ ] Test all routes work properly

#### Option B: Netlify

- [ ] Connect GitHub repository to Netlify
- [ ] Configure build settings:
  - Build command: `npm run build:prod`
  - Publish directory: `build`
- [ ] Set up custom domain: vhbanquets.com
- [ ] Configure environment variables
- [ ] Test deployment

#### Option C: Vercel

- [ ] Connect GitHub repository to Vercel
- [ ] Configure custom domain: vhbanquets.com
- [ ] Set environment variables
- [ ] Test deployment

#### Option D: Docker/VPS

- [ ] Server is set up with Docker and Docker Compose
- [ ] Domain points to server IP
- [ ] SSL certificate is configured (Let's Encrypt)
- [ ] Run `docker-compose up -d`
- [ ] Configure reverse proxy (nginx)

## Post-Deployment Verification

### ✅ Functionality Testing

- [ ] Homepage loads correctly at <https://vhbanquets.com>
- [ ] All navigation links work
- [ ] Staff Management functionality works
- [ ] Floor Plan Editor loads and functions
- [ ] PDF upload and analysis works
- [ ] Forms submit correctly
- [ ] Mobile responsiveness works

### ✅ Performance & Security

- [ ] Site loads quickly (< 3 seconds)
- [ ] Lighthouse audit shows good scores
- [ ] Security headers are present (check with securityheaders.com)
- [ ] HTTPS is enforced (redirects from HTTP)
- [ ] No console errors in browser
- [ ] Images and assets load correctly

### ✅ SEO & Analytics

- [ ] Meta tags are properly set
- [ ] Favicon appears correctly
- [ ] robots.txt is accessible
- [ ] Google Analytics is configured (if needed)
- [ ] Search console is set up (if needed)

### ✅ Monitoring Setup

- [ ] Error monitoring is configured
- [ ] Performance monitoring is active
- [ ] Uptime monitoring is set up
- [ ] Backup system is configured

## Troubleshooting Common Issues

### Issue: Blank page after deployment

**Solution**: Check that all files are uploaded and `.htaccess` is configured for SPA routing

### Issue: 404 errors on refresh

**Solution**: Ensure server is configured to serve `index.html` for all routes

### Issue: Assets not loading

**Solution**: Verify the `homepage` field in `package.json` matches your domain

### Issue: API calls failing

**Solution**: Check CORS settings and update API URLs in environment variables

## Emergency Rollback Plan

1. Keep previous version backed up
2. Document current deployment settings
3. Have rollback procedure ready:
   - Restore previous files
   - Update DNS if needed
   - Clear CDN cache if applicable

## Support Contacts

- **Domain/DNS**: Contact your domain registrar
- **Hosting**: Contact your hosting provider
- **SSL**: Contact your SSL certificate provider
- **Application**: Check GitHub issues or contact development team

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Version**: ___________
**Notes**: ___________
