// עוטף fetch (הגלובלי, מובנה ב-Node 18+) עם timeout - כדי שקריאה תקועה ל-API
// חיצוני לא תתלה את כל הבקשה של המשתמש.
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}
