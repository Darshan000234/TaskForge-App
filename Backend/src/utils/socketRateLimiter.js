export const socketRateLimiter = async ({
  redis,
  key,
  limit,
  windowSec,
}) => {
  const lua = `
    local current = redis.call("INCR", KEYS[1])

    if current == 1 then
      redis.call("EXPIRE", KEYS[1], ARGV[1])
    end

    return current
  `;

  const current = await redis.eval(
    lua,
    1,
    key,
    windowSec
  );

  return Number(current) > limit;
};