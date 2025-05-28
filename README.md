# Secure File Upload & Metadata Processing Microservice

A Node.js backend microservice that handles authenticated file uploads, stores associated metadata in a database, and processes files asynchronously using NestJS, PostgreSQL, and BullMQ.

## Features

- 🔐 JWT Authentication
- 📤 Secure File Upload with Metadata
- 🔄 Asynchronous File Processing
- 📊 File Status Tracking
- 🔍 File Hash Generation
- 🔁 Automatic Job Retries
- 📱 Pagination Support
- 👤 User-specific File Access

## Tech Stack

- Node.js (>=18)
- NestJS
- PostgreSQL
- BullMQ (Redis)
- TypeORM
- JWT Authentication

## Prerequisites

- Node.js >= 18
- PostgreSQL
- Redis
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd file-uploader
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=file_uploader

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Environment
NODE_ENV=development
```

4. Create the database:
```sql
CREATE DATABASE file_uploader;
```

5. Start the application:
```bash
npm run start:dev
```

## API Documentation

### Authentication

#### POST /auth/login
Login to get JWT token
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### File Operations

#### POST /files/upload
Upload a file with metadata
- Requires JWT token
- Form data:
  - file: The file to upload
  - title: (optional) File title
  - description: (optional) File description

#### GET /files/:id
Get file details
- Requires JWT token
- Returns file metadata, status, and processing results

#### GET /files
List user's files
- Requires JWT token
- Query parameters:
  - page: Page number (default: 1)
  - limit: Items per page (default: 10)

#### POST /files/:id/retry
Retry processing a failed file
- Requires JWT token

## File Processing

The service processes uploaded files asynchronously:
1. File is uploaded and saved to disk
2. Background job is queued
3. Job processes the file (calculates hash)
4. Status is updated in database

## Security Features

- JWT Authentication
- User-specific file access
- File size limits (5MB)
- Secure file storage
- Input validation

## Development

```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## License

MIT

## Author

[Your Name] 