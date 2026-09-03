import { apiClient } from "./client";

// כתובת השרת (בלי הסיומת /api) - כדי לבנות URL מלא לתמונות הסטטיות
const SERVER_ORIGIN = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000/api"
).replace(/\/api\/?$/, "");

/** מחזיר רשימת URLs מלאים לתמונות שנמצאות כרגע ב-server/public/backgrounds */
export async function listBackgroundImages(): Promise<string[]> {
  const { data } = await apiClient.get<{ images: string[] }>("/background-images");
  return data.images.map((relativePath) => `${SERVER_ORIGIN}${relativePath}`);
}
