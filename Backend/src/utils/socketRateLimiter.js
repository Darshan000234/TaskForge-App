
export const socketRateLimiter = async ({
  redis,
  key,
  limit,
  windowSec
}) => {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSec);
  }

  return current > limit;
};