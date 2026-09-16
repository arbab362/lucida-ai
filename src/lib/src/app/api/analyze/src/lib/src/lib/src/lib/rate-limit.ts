const requests = new Map<string, number[]>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

export function isRateLimited(userId: string): boolean {
  const now = Date.now();

  const timestamps = requests.get(userId) ?? [];

  const recentRequests = timestamps.filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );

  if (recentRequests.length >= MAX_REQUESTS) {
    requests.set(userId, recentRequests);
    return true;
  }

  recentRequests.push(now);
  requests.set(userId, recentRequests);

  return false;
}
