import IORedis from "ioredis";
import { UPSTASH_TCP_REDIS_URL } from "./const.js";

export const redisConnection = new IORedis(UPSTASH_TCP_REDIS_URL,{
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false
});
