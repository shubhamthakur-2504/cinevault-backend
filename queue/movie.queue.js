import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const movieInsertQueue = new Queue("movie-insert-queue", {
    connection: redisConnection
});

