import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import Movie from "../models/movie.model.js";

// BACKGROUND WORKER
export const movieInsertWorker = new Worker(
    "movie-insert-queue",
    async job => {
        console.log("🔥 Processing movie insertion:", job.data.title);

        try {
            await Movie.create(job.data);
            console.log("✅ Movie inserted:", job.data.title);
        } catch (err) {
            console.error("❌ Movie insertion failed:", err);
            throw err;
        }
    },
    { connection: redisConnection }
);

// Log worker failures
movieInsertWorker.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err);
});
