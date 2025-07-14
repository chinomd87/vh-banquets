# VH Banquets - Event Management System

![VH Banquets](https://img.shields.io/badge/VH%20Banquets-Event%20Management-blue)
![React Native](https://img.shields.io/badge/React%20Native-Mobile%20App-green)
![Node.js](https://img.shields.io/badge/Node.js-Backend%20API-yellow)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-orange)

A comprehensive mobile-first event management and banquet planning system built with React Native, Node.js, and PostgreSQL.

## 🏗️ **Project Architecture**

```
vh-banquets/
├── mobile/              # React Native Mobile App (Primary Interface)
├── backend/             # Node.js/Express API + PostgreSQL
├── docs/                # Documentation & Legacy Component Backups
├── legacy-*/            # Deprecated files (to be removed)
└── README.md            # This file
```

## Features

- 📋 **Event Management**: Create, edit, and manage banquet events
- 👥 **Staff Management**: Manage staff members with roles and contact information
- 🏗️ **Floor Plan Editor**: Interactive floor plan designer with drag-and-drop functionality
- 📄 **PDF Analysis**: Upload and analyze event documents
- 📊 **Analytics Dashboard**: Track event metrics and performance
- ✍️ **Digital Signatures**: RhodeSign integration for secure contract signing
- ♿ **Accessibility**: WCAG 2.1 compliant with screen reader support
- 🔒 **Security**: Hardened with security headers and best practices
- 🐳 **Docker Support**: Containerized deployment with monitoring
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Quick Start

### Development

```bash
npm install
npm start
```

### Production Build

```bash
npm run build:prod
```

### Deployment to vhbanquets.com

```bash
./build-deploy.sh
```

## Deployment Options

### Option 1: Traditional Web Hosting (cPanel)

1. Run `./build-deploy.sh` to create deployment package
2. Upload contents of `deploy/` folder to your `public_html` directory
3. Configure domain to point to vhbanquets.com
4. Set up SSL certificate

### Option 2: Netlify (Recommended)

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build:prod`
3. Set publish directory: `build`
4. Configure custom domain: vhbanquets.com

### Option 3: Vercel

1. Connect GitHub repository to Vercel
2. Deploy automatically with zero configuration
3. Configure custom domain: vhbanquets.com

### Option 4: Docker Deployment

```bash
docker-compose up -d
```

## Environment Configuration

### Production (.env.production)

- `REACT_APP_API_URL=https://api.vhbanquets.com`
- `REACT_APP_DOMAIN=vhbanquets.com`
- `GENERATE_SOURCEMAP=false`

## Security Features

- 🛡️ Content Security Policy (CSP)
- 🔒 Security headers (HSTS, X-Frame-Options, etc.)
- 🚫 Source map disabled in production
- 🔐 Docker security hardening
- 📊 Monitoring with Prometheus and Grafana

## Monitoring & Analytics

- **Prometheus**: Application metrics
- **Grafana**: Dashboards and visualization
- **cAdvisor**: Container monitoring
- **Alertmanager**: Alert management
- **Lighthouse CI**: Performance auditing

## Development Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.

## RhodeSign Integration

VH Banquets is integrated with RhodeSign for secure digital contract signing.

### Signature Features

- 🔐 **Secure Digital Signatures**: Legally binding electronic signatures
- 📝 **Contract Generation**: Automatic contract creation from event data
- 🔔 **Real-time Updates**: Webhook-based status notifications
- 📊 **Signature Dashboard**: Monitor all signature workflows
- 🔄 **Automatic Retry**: Built-in retry mechanisms for failed attempts

### Setup

See [RHODESIGN_INTEGRATION.md](RHODESIGN_INTEGRATION.md) for detailed setup instructions.

### Quick Setup

```bash
# Backend environment
RHODESIGN_API_KEY=your_api_key
RHODESIGN_WEBHOOK_SECRET=your_secret

# Frontend environment
REACT_APP_RHODESIGN_ENABLED=true
```

## Documentation

- 📋 [Deployment Guide](DEPLOYMENT.md)
- ✅ [Deployment Checklist](DEPLOYMENT-CHECKLIST.md)
- 🔐 [RhodeSign Integration](RHODESIGN_INTEGRATION.md)
- 🌐 [GitHub Setup](GITHUB-SETUP.md)
- 🚀 [Netlify Setup](NETLIFY-SETUP.md)

## Available Scripts

In the project directory, you can run:

### `npm start` (Development)

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
