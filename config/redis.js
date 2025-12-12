import IORedis from "ioredis";
import { UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN } from "./const.js";

export const redisConnection = new IORedis(
    UPSTASH_REDIS_URL,{
        password: UPSTASH_REDIS_TOKEN,
        tls: {}
    }
);
