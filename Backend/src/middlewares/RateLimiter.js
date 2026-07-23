import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../config/redis.js";

const createLimiter = (max, windowMs, name) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),

    windowMs,
    max,
    validate: {
      singleCount: false,
    },

    keyGenerator: (req) => {
      if (req.user?.id) {
        return `rate:${name}:user:${req.user.id}`;
      }

      return `rate:${name}:ip:${ipKeyGenerator(req)}`;
    },

    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
      console.log(`${name} limit exceeded`, {
        user: req.user?.id,
        ip: req.ip,
        url: req.originalUrl,
      });

      return res.status(429).json({
        message: "Too many requests",
      });
    },
  });
};

export const writeLimiter = createLimiter(40, 60 * 1000, "WRITE");
export const readLimiter = createLimiter(150, 60 * 1000, "READ");
export const authLimiter = createLimiter(5, 60 * 1000, "AUTH");
export const globalLimiter = createLimiter(300, 15 * 60 * 1000, "GLOBAL");
export const sensitiveLimiter = createLimiter(3, 60 * 1000, "SENSITIVE");
export const searchLimiter = createLimiter(300, 60 * 1000, "SEARCH");
export const chatLimiter = createLimiter(20, 60 * 1000, "CHAT");
export const RefreshLimiter = createLimiter(30, 60 * 1000, "AUTH_REFRESH")
export const methodLimiter = (req, res, next) => {
  const limiter = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
    ? writeLimiter
    : readLimiter;

  return limiter(req, res, next);
};