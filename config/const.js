import dotenv from 'dotenv';
dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 3000;
const DB_NAME = process.env.DB_NAME || 'mydatabase';
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/';

export { CLIENT_URL, PORT, DB_NAME, MONGODB_URL };