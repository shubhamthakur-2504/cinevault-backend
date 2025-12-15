import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';

import { CLIENT_URL, PORT, ENABLE_WORKER } from './config/const.js';
import { connectDB } from './config/db.js';

import authRoutes from './routes/auth.route.js';
import movieRoutes from './routes/movie.route.js';

await connectDB();

const app = express();

if (ENABLE_WORKER === "true") {
    console.log("🟢 Worker enabled in API process");
    import("./queue/movie.worker.js")
        .then(() => {
            console.log("🎯 Worker started");
        })
        .catch(err => {
            console.error("❌ Failed to start worker:", err);
        });
}

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
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);


// error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    if (req.file) {
        // delete the uploaded file in case of any error
        fs.unlink(req.file?.path, (unlinkErr) => {
            if (unlinkErr) {
                console.error("Error deleting local file:", unlinkErr);
            }
        });
    }
    res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});