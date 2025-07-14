# VH Banquets Backend API

Node.js/Express API server for VH Banquets event management system with PostgreSQL database.

## 🚀 Quick Start

### Prerequisites
- Node.js 22+ 
- PostgreSQL 14+
- npm 10+

### Installation

1. **Clone and install dependencies:**
```bash
cd backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Set up PostgreSQL database:**
```bash
# Create database
createdb vh_banquets

# Run migrations
npm run migrate
```

4. **Start development server:**
```bash
npm run dev
```

The API will be running at `http://localhost:3001`

## 📊 Database Setup

### Using Docker (Recommended)
```bash
docker run --name vh-banquets-postgres \
  -e POSTGRES_DB=vh_banquets \
  -e POSTGRES_USER=vh_banquets_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Local PostgreSQL
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database and user
createdb vh_banquets
createuser vh_banquets_user
```

### Run Migrations
```bash
# Run migration
npm run migrate

# Check status
npm run migrate status

# Reset database (caution!)
npm run migrate reset
```

## 🏗️ API Architecture

### Authentication
- **JWT tokens** for access control
- **Refresh tokens** for session management
- **Role-based permissions** (admin, staff, client)

### Database Schema
```
users (authentication)
├── clients (customer information)
├── events (banquet events)
│   ├── event_menu_selections
│   ├── event_staff_assignments
│   ├── payments
│   └── event_timeline
├── staff (employee management)
├── menu_items (catalog)
├── inventory_items
├── floor_plans
├── files (documents/photos)
└── contracts (legal agreements)
```

## 🔗 API Endpoints

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - User login
POST   /api/auth/refresh       - Refresh access token
POST   /api/auth/logout        - User logout
GET    /api/auth/me            - Get current user
PUT    /api/auth/change-password - Change password
```

### Events
```
GET    /api/events             - Get all events (paginated)
POST   /api/events             - Create new event
GET    /api/events/:id         - Get event details
PUT    /api/events/:id         - Update event
DELETE /api/events/:id         - Delete event
GET    /api/events/:id/summary - Get event summary
```

### Clients
```
GET    /api/clients            - Get all clients
POST   /api/clients            - Create new client
GET    /api/clients/:id        - Get client details
PUT    /api/clients/:id        - Update client
DELETE /api/clients/:id        - Delete client
GET    /api/clients/:id/events - Get client's events
```

### Users (Admin only)
```
GET    /api/users              - Get all users
GET    /api/users/:id          - Get user details
PUT    /api/users/:id          - Update user
DELETE /api/users/:id          - Delete user
GET    /api/users/stats/overview - User statistics
```

### User Profile
```
GET    /api/users/profile      - Get current user profile
PUT    /api/users/profile      - Update current user profile
```

## 🔐 Security Features

- **Helmet.js** - Security headers
- **Rate limiting** - Prevent abuse
- **Input validation** - Joi schemas
- **SQL injection protection** - Parameterized queries
- **CORS** - Cross-origin configuration
- **Password hashing** - bcryptjs
- **JWT tokens** - Secure authentication

## 📝 Request/Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed",
  "data": {
    "user": { ... }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details"
}
```

### Pagination
```json
{
  "success": true,
  "data": {
    "events": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalEvents": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## 🛠️ Development

### Scripts
```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm run migrate    # Run database migrations
npm run seed       # Seed database (coming soon)
npm test           # Run tests
npm run lint       # Code linting
```

### Environment Variables
```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/vh_banquets
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vh_banquets
DB_USER=vh_banquets_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Storage (choose one)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=vh-banquets-files

# Or Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📋 Testing

### Manual API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vhbanquets.com",
    "password": "securepassword123",
    "firstName": "Admin",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vhbanquets.com",
    "password": "securepassword123"
  }'
```

### Test with Authenticated Requests
```bash
# Get events (replace TOKEN with your JWT)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/events
```

## 🚀 Deployment

### Production Environment
```bash
# Install dependencies
npm ci --production

# Set environment variables
export NODE_ENV=production
export DATABASE_URL=your_production_db_url

# Run migrations
npm run migrate

# Start server
npm start
```

### Docker Deployment
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📁 Project Structure

```
backend/
├── config/           # Configuration files
│   ├── database.js   # Database connection
│   └── logger.js     # Winston logger
├── middleware/       # Express middleware
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── routes/           # API route handlers
│   ├── auth.js
│   ├── events.js
│   ├── clients.js
│   └── users.js
├── scripts/          # Database scripts
│   └── migrate.js
├── database/         # Database files
│   └── schema.sql
├── logs/            # Log files (auto-created)
├── .env.example     # Environment template
├── server.js        # Main server file
└── package.json
```

## 🔄 Migration Status

### ✅ Completed (Phase 1 - Week 1)
- [x] PostgreSQL database schema
- [x] Express.js server setup
- [x] JWT authentication system
- [x] User management endpoints
- [x] Event CRUD operations
- [x] Client management API
- [x] Security middleware
- [x] Database migrations
- [x] Logging system
- [x] Error handling

### 🚧 In Progress (Phase 1 - Week 2)
- [ ] Staff management API
- [ ] Menu system API
- [ ] Payment tracking API
- [ ] File upload integration
- [ ] Inventory management API
- [ ] Floor plan API
- [ ] Contract management API

### 📅 Next Steps
- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation
- [ ] Performance optimization
- [ ] Production deployment

---

**Status**: Phase 1 Backend (50% Complete)  
**Next**: Complete remaining API endpoints  
**ETA**: Week 2 completion by July 21, 2025
