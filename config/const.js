import dotenv from 'dotenv';
dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL;
const PORT = process.env.PORT || 3000;

export { CLIENT_URL, PORT };