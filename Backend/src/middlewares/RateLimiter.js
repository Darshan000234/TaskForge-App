import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../config/redis.js";

const createLimiter = (max, windowMs) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
      if (req.user?.id) return `user_${req.user.id}`;
      return ipKeyGenerator(req);
    },

    message: {
      message: "Too many requests, slow down.",
    },
  });
};

export const authLimiter = createLimiter(5, 60 * 1000);

export const writeLimiter = createLimiter(40, 60 * 1000);

export const readLimiter = createLimiter(150, 60 * 1000);

export const globalLimiter = createLimiter(300, 15 * 60 * 1000);

export const sensitiveLimiter = createLimiter(3, 60 * 1000);

export const methodLimiter = (req, res, next) => {
  const limiter =
    ["POST", "PATCH", "DELETE"].includes(req.method)
      ? writeLimiter
      : readLimiter;

  return limiter(req, res, next);
};