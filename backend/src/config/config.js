// config.js
import path from "path";
import dotenv from "dotenv";

export function loadConfig(env = "dev") {
    const envFile = `.env.${env}`;

    const result = dotenv.config({
        path: path.resolve(process.cwd(), envFile),
    });

    if (result.error) {
        throw new Error(`Failed to load ${envFile}`);
    }

    const requiredVars = [
        "PORT",
        "MONGO_URI",
        "JWT_SECRET_KEY",
        "JWT_TOKEN_ISSUER",
        "REDIS_URI",
        "RABBIT_MQ_URI",
    ];

    for (const key of requiredVars) {
        if (!process.env[key]) {
            throw new Error(`Missing required env variable: ${key}`);
        }
    }

    return Object.freeze({
        ENV: env,
        PORT: Number(process.env.PORT),
        MONGO_URI: process.env.MONGO_URI,
        JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
        JWT_TOKEN_ISSUER: process.env.JWT_TOKEN_ISSUER,
        REDIS_URI: process.env.REDIS_URI,
        RABBIT_MQ_URI: process.env.RABBIT_MQ_URI,
        HEALTH_STATUS_QUEUE: process.env.HEALTH_STATUS_QUEUE ?? "health_status_queue",
        ALERT_QUEUE: process.env.ALERT_QUEUE ?? "alert_queue",
    });
}
