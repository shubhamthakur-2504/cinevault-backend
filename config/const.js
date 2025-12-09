import dotenv from 'dotenv';
dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 3000;
const DB_NAME = process.env.DB_NAME || 'mydatabase';
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY;
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY;
const HTTP_COOKIE_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; 

export { CLIENT_URL, PORT, DB_NAME, MONGODB_URL, JWT_REFRESH_SECRET, JWT_ACCESS_SECRET, JWT_REFRESH_EXPIRY, JWT_ACCESS_EXPIRY, HTTP_COOKIE_EXPIRES_IN };