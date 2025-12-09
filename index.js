import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';

import { CLIENT_URL, PORT } from './config/const.js';


const app = express();

app.use(cors({
    origin: CLIENT_URL,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
    res.status(200).send("API is healthy");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});