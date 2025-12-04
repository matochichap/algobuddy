import Redis from 'ioredis';

const redis = new Redis({
    port: parseInt(process.env.REDIS_PORT!),
    host: process.env.REDIS_HOST!,
    username: process.env.REDIS_USERNAME!,
    password: process.env.REDIS_PASSWORD!,
});

redis.on("connect", () => {
    console.log("Connected to Redis");
});

export default redis;