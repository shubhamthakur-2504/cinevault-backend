# 📜 Scripts Documentation

This folder contains one-time utility scripts used for database seeding and initial setup.
These scripts are not part of the runtime application and must be executed manually.

# 📂 Available Scripts
## 1️⃣ movies.js — Seed Movies & Series

Seeds the MongoDB database with live-action movies and TV series using the OMDb API.

### Features

- Uses OMDb API (ISP-friendly)
- Fetches both movies and series
- Converts series episodes into total duration
- Filters out low-quality titles
- Stores IMDb ratings for sorting
- Does not use application runtime env
- Safe to run only once

### Requirements

- MongoDB Atlas (or any MongoDB URI)
- OMDb API key
- Node.js v18+ (for native fetch)

## 2️⃣ genAdmin.js — Generate Admin User

Creates an ADMIN user in the database for accessing admin-only features.

### Features

- Reads admin credentials from environment variables
- Password is securely hashed via Mongoose hooks
- Prevents duplicate admin creation
- Safe to keep in repository
- Should be run only once

## 🔐 Environment Configuration

These scripts use a separate environment file to avoid polluting the app’s runtime configuration.

Create scripts/.env
MONGODB_URI=mongodb+srv://<your-mongodb-uri>

# OMDb (for movies.js)
OMDB_API_KEY=your_omdb_api_key

# Admin credentials (for genAdmin.js)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongPassword@123

### ▶️ How to Run Scripts

From the project root:

Seed Movies & Series
```
node scripts/movies.js
```
Create Admin User
```
node scripts/genAdmin.js
```
## ⚠️ Important Notes
- These scripts are one-time operations
- Do not run them in production repeatedly
- Movie seeding does not use queues intentionally
- Seeded movies use createdBy: null
- Admin creation is idempotent (won’t create duplicates)

### 🧠 Design Decisions
- OMDb API was chosen due to ISP restrictions with TMDB in some regions
- Environment isolation ensures security and clarity

### 🧹 Cleanup (Optional)
- After successful execution, you may:
- Delete scripts/.env
- Disable or archive seed scripts
- Rotate admin credentials if required

## 📌 Disclaimer

These scripts are meant for development and demonstration purposes only.
They should not be exposed or triggered via API endpoints.
Don't push these scripts to production servers, add them to your .gitignore.