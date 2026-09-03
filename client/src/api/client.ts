import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const apiClient = axios.create({ baseURL: API_BASE_URL });

const TOKEN_STORAGE_KEY = "trip_planner_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// מצרפים את ה-JWT לכל בקשה יוצאת (אם קיים)
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// שגיאת 401 גלובלית -> מנקים טוקן ומפנים ללוגין (הטיפול בניווט בפועל נעשה ב-AuthContext)
export const AUTH_ERROR_EVENT = "trip-planner-auth-error";

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event(AUTH_ERROR_EVENT));
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    if (data?.error?.message) return data.error.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "אירעה שגיאה לא צפויה";
}
