import { performance } from "node:perf_hooks";

const roundMs = (value) => Math.round(value * 10) / 10;

export const perfNow = () => performance.now();

export const elapsedMs = (startedAt) => roundMs(perfNow() - startedAt);

// Keep timing logs opt-in so normal production traffic is not noisy.
export const logPerformance = ({
  req,
  endpoint,
  statusCode,
  startedAt,
  stages = {},
  extra = {},
}) => {
  if (process.env.PERFORMANCE_LOGS !== "true") return;

  const stagesMs = Object.fromEntries(
    Object.entries(stages).map(([name, duration]) => [name, roundMs(duration)])
  );

  console.info(
    "[TaskForge perf]",
    JSON.stringify({
      requestId: req?.performanceRequestId ?? null,
      endpoint,
      statusCode,
      totalMs: elapsedMs(startedAt),
      stagesMs,
      ...extra,
    })
  );
};
