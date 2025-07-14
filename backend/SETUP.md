# VH Banquets Backend Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- AWS Account (for S3 file storage)

## Database Setup

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE vh_banquets;
CREATE USER vh_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE vh_banquets TO vh_admin;

# Exit PostgreSQL
\q
```

### 3. Database Schema

Create the database tables by running:

```bash
cd backend
npm run migrate
```

Or manually execute the SQL schema (see `database/schema.sql`).

## Environment Configuration

### 1. Create Environment File

Copy the example environment file:

```bash
cd backend
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your settings:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://vh_admin:your_secure_password@localhost:5432/vh_banquets

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=vh-banquets-files

# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=10485760
```

## AWS S3 Setup

### 1. Create S3 Bucket

1. Go to AWS Console → S3
2. Create new bucket named `vh-banquets-files` (or your chosen name)
3. Set region (e.g., `us-east-1`)
4. Configure bucket settings:
   - Block public access: Keep enabled
   - Versioning: Optional
   - Encryption: Recommended

### 2. Create IAM User

1. Go to AWS Console → IAM
2. Create new user: `vh-banquets-api`
3. Attach policy with S3 permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::vh-banquets-files",
                "arn:aws:s3:::vh-banquets-files/*"
            ]
        }
    ]
}
```

4. Generate access keys and add to `.env` file

## Installation & Running

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run Database Migrations

```bash
npm run migrate
```

### 3. Seed Database (Optional)

```bash
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Test API Endpoints

```bash
chmod +x test-api.sh
./test-api.sh
```

## API Testing

### Using curl

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

### Using Postman

1. Import the Postman collection: `docs/VH-Banquets-API.postman_collection.json`
2. Set environment variables:
   - `baseUrl`: `http://localhost:3001/api`
   - `token`: Your JWT token from login

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001

# Use production database
DATABASE_URL=postgresql://user:pass@production-db:5432/vh_banquets

# Strong JWT secrets
JWT_SECRET=super_strong_production_secret_64_chars_minimum
JWT_REFRESH_SECRET=super_strong_refresh_secret_64_chars_minimum

# Production AWS settings
AWS_REGION=us-east-1
AWS_S3_BUCKET=vh-banquets-prod-files
```

### Production Checklist

- [ ] Database properly configured with SSL
- [ ] AWS S3 bucket secured with proper IAM policies
- [ ] JWT secrets are strong (64+ characters)
- [ ] Rate limiting configured appropriately
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database backups configured
- [ ] Monitoring and logging set up
- [ ] File upload limits appropriate for production

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database and user exist

2. **JWT Token Invalid**
   - Check JWT_SECRET is set
   - Verify token format in Authorization header

3. **File Upload Failed**
   - Verify AWS credentials
   - Check S3 bucket permissions
   - Ensure bucket exists in correct region

4. **Port Already in Use**
   - Change PORT in .env file
   - Kill process using port: `lsof -ti:3001 | xargs kill -9`

### Logs

Check application logs:
```bash
# Development
npm run dev

# Production
pm2 logs vh-banquets-api
```

## Security Considerations

1. **Authentication**: JWT with secure secrets
2. **Authorization**: Role-based access control
3. **Input Validation**: Joi schemas on all endpoints
4. **Rate Limiting**: Prevents abuse
5. **File Security**: S3 with presigned URLs
6. **SQL Injection**: Parameterized queries
7. **CORS**: Configured for frontend domain
8. **Helmet**: Security headers enabled

## Performance Optimization

1. **Database Indexing**: Key fields indexed
2. **Connection Pooling**: PostgreSQL pool configured
3. **Caching**: Ready for Redis integration
4. **Pagination**: All list endpoints paginated
5. **File Streaming**: Large file handling optimized

## API Documentation

- **Swagger UI**: `http://localhost:3001/api/docs` (when running)
- **Postman Collection**: Import from `docs/` folder
- **API Reference**: See individual route files for endpoint details

## Next Steps

1. **Testing**: Run comprehensive API tests
2. **Documentation**: Generate/update API docs
3. **Frontend**: Begin React Native app development
4. **Deployment**: Set up production environment
5. **Monitoring**: Add logging and metrics
