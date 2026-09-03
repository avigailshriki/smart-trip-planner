import { apiClient } from "./client";
import type { User } from "./types";

export async function registerRequest(input: { name: string; email: string; password: string }) {
  const { data } = await apiClient.post<{ token: string; user: User }>("/auth/register", input);
  return data;
}

export async function loginRequest(input: { email: string; password: string }) {
  const { data } = await apiClient.post<{ token: string; user: User }>("/auth/login", input);
  return data;
}

export async function meRequest() {
  const { data } = await apiClient.get<{ user: User }>("/auth/me");
  return data.user;
}
