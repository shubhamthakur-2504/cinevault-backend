# 🎬 CineVault - Backend API

**MERN Stack Movie Application with Role-Based Access Control**

A production-ready RESTful API built with Node.js and Express.js, featuring JWT authentication, role-based authorization, background job processing with BullMQ, and MongoDB for data persistence.

---

## 🚀 Live Demo
- [Live Demo](https://cinevault-app.vercel.app/)
- [Frontend Repo](https://github.com/shubhamthakur-2504/cinevault-frontend)

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Refresh token rotation for enhanced security
- HTTP-only cookies for refresh token storage
- Role-based access control (USER, ADMIN)
- Secure password hashing with bcrypt
- Token expiration and automatic refresh

### 🎬 Movie Management
- **CRUD Operations** (Admin only)
  - Create movies with poster upload
  - Edit movie details
  - Delete movies with Cloudinary cleanup
- **Public Features**
  - Browse all movies with cursor-based pagination
  - Search movies by title or description (MongoDB text search)
  - Sort movies by name, rating, release date, or duration
  - Optimized indexing for fast queries

### 🖼️ Image Handling
- Cloudinary integration for poster uploads
- Automatic image deletion on movie removal
- Support for both file upload and URL-based posters
- Image validation and error handling

### ⚡ Background Processing
- BullMQ + Redis (Upstash) for distributed job queue
- Lazy insertion of movies to improve API responsiveness
- Worker process for asynchronous movie creation
- Concurrency control and error handling
- Environment-based worker toggling for deployment flexibility

### 🛡️ Error Handling
- Centralized error handling middleware
- Custom `apiError` and `apiResponse` classes
- Graceful handling of invalid inputs
- Detailed error messages in development
- Sanitized error responses in production

---

## 🧩 Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js (v18+) |
| **Framework** | Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (jsonwebtoken) |
| **Password Hashing** | bcrypt |
| **File Upload** | Multer |
| **Cloud Storage** | Cloudinary |
| **Job Queue** | BullMQ |
| **Cache/Queue Store** | Redis (Upstash) |
| **Validation** | Express Validator |
| **Security** | CORS |
| **Environment** | dotenv |

---

## 🔌 API Endpoints

### **Health Check**
```
GET /api/health
```
Returns API status and uptime.

---

### **Authentication Routes** (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | Login user | ❌ |
| POST | `/refresh-token` | Refresh access token | ✅ (Cookie) |
| GET | `/profile` | Get user profile | ✅ |
| POST | `/logout` | Logout user | ✅ |

### **Movie Routes** (`/api/movies`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/` | Get all movies (paginated) | ❌ | ❌ |
| GET | `/search` | Search movies | ❌ | ❌ |
| GET | `/sorted` | Get sorted movies | ❌ | ❌ |
| POST | `/` | Create movie | ✅ | ✅ |
| PATCH | `/:id` | Update movie | ✅ | ✅ |
| DELETE | `/:id` | Delete movie | ✅ | ✅ |

---

## 🔐 Authentication Flow

### 1. **User Registration/Login**
```
Client → POST /api/auth/login
       ← Access Token (JSON) + Refresh Token (HTTP-only cookie)
```

### 2. **Making Authenticated Requests**
```
Client → GET /api/movies (with Authorization: Bearer <access_token>)
       ← Protected data
```

### 3. **Token Refresh (on 401)**
```
Client → POST /api/auth/refresh-token (with refresh token cookie)
       ← New Access Token
Client → Retry original request with new token
```

### 4. **Logout**
```
Client → POST /api/auth/logout
       ← Refresh token cleared from database and cookie
```

---

## 🗄️ Database Schema

### **User Model**
```javascript
{
  userName: String (unique, indexed),
  email: String (unique, lowercase),
  passwordHash: String (bcrypt hashed, not selected by default),
  role: Enum ['USER', 'ADMIN'] (default: 'USER'),
  isActive: Boolean (default: true),
  refreshToken: String (not selected by default),
  createdAt: Date,
  updatedAt: Date
}
```

**Methods:**
- `comparePassword(password)` - Verify password
- `generateAccessToken()` - Create JWT access token
- `generateRefreshToken()` - Create & save refresh token

---

### **Movie Model**
```javascript
{
  title: String (required, indexed, text search),
  description: String (required, text search),
  posterUrl: String (required),
  rating: Number (0-10, indexed),
  releaseDate: Date (indexed),
  duration: Number (minutes, indexed),
  genre: [String],
  createdBy: ObjectId (ref: 'User', nullable),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- Text index on `title` and `description` for search
- Single field indexes on `rating`, `releaseDate`, `duration`
- Compound text index for optimized full-text search

---

## ⚡ Background Jobs

### **Queue Architecture**

```
API Request (POST /movies)
     ↓
Validate Data
     ↓
Upload Poster to Cloudinary
     ↓
Add Job to BullMQ Queue
     ↓
Return 202 Accepted
     ↓
[Worker Process]
     ↓
Insert Movie to MongoDB
     ↓
Handle Success/Failure
```

### **Why Background Jobs?**

1. **Improved Response Time**: API responds immediately (202) without waiting for DB insertion
2. **Scalability**: Workers can be scaled independently
3. **Reliability**: Failed jobs can be retried automatically
4. **Concurrency Control**: Prevents race conditions during high traffic

### **Worker Configuration**

Set in `.env`:
```env
ENABLE_WORKER=true    # Start worker with API (Render free tier)
WORKER_COUNT=1        # Number of concurrent jobs
```

**Production Setup:**
- Deploy worker as separate service
- Scale workers independently
- Set `ENABLE_WORKER=false` on API instances

---

## 🔧 Environment Setup

### **Create `.env` file**

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cinevault

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis (Upstash)
REDIS_URL=redis://default:password@host:port

# CORS
CLIENT_URL=http://localhost:3000

# Worker (Render Free Tier)
ENABLE_WORKER=true
WORKER_COUNT=1
```

### **Scripts Configuration** (`scripts/.env`)

For seeding data only:
```env
MONGODB_URI=mongodb+srv://...
OMDB_API_KEY=your_omdb_key

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword@123
```

---

## 📥 Installation

### **Prerequisites**
- Node.js v18+ and npm
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Cloudinary account

### **Steps**

1. **Clone the repository**
   ```bash
   git clone https://github.com/shubhamthakur-2504/cinevault-backend.git
   cd cinevault-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Run the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

5. **Verify API is running**
   ```bash
   curl http://localhost:5000/api/health
   ```

---

## 🌱 Seeding Data

### **1. Create Admin User**
```bash
cd scripts
cp .env.example .env
# Edit scripts/.env with your credentials
node genAdmin.js
```

### **2. Seed Movies from OMDb**
```bash
# Add OMDB_API_KEY to scripts/.env
node movies.js
```

See `scripts/README.md` for detailed instructions.

---
## 📈 Scalability & Performance

### **Database Optimization**
- ✅ Indexed fields for fast queries (rating, releaseDate, duration)
- ✅ Text indexes for full-text search
- ✅ Cursor-based pagination (no offset/limit)
- ✅ Lean queries for read operations
- ✅ Connection pooling with Mongoose

### **API Performance**
- ✅ Async/await error handling with `asyncHandler`
- ✅ Background job processing with BullMQ
- ✅ Cloudinary for external image hosting
- ✅ Stateless design (horizontal scaling ready)
## 👤 Author

**Shubham Thakur**
- GitHub: [@shubhamthakur-2504](https://github.com/shubhamthakur-2504)