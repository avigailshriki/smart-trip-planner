import { apiClient } from "./client";
import type { BudgetLevel, Trip, TripWithItinerary } from "./types";

export interface CreateTripInput {
  destinationName: string;
  startDate: string;
  endDate: string;
  budgetLevel: BudgetLevel;
  interests: string[];
}

export async function createTripRequest(input: CreateTripInput) {
  const { data } = await apiClient.post<{ trip: Trip }>("/trips", input);
  return data.trip;
}

export async function listTripsRequest() {
  const { data } = await apiClient.get<{ trips: Trip[] }>("/trips");
  return data.trips;
}

export async function getTripRequest(tripId: string) {
  const { data } = await apiClient.get<{ trip: TripWithItinerary }>(`/trips/${tripId}`);
  return data.trip;
}

export async function generateTripRequest(tripId: string) {
  const { data } = await apiClient.post<{ trip: TripWithItinerary }>(`/trips/${tripId}/generate`);
  return data.trip;
}

export async function deleteTripRequest(tripId: string) {
  await apiClient.delete(`/trips/${tripId}`);
}

export interface ActivityInput {
  name: string;
  description?: string;
  category?: string;
  startTime?: string;
  durationMinutes?: number;
  estimatedCostUsd?: number;
}

export async function addActivityRequest(
  tripId: string,
  dayId: string,
  input: ActivityInput
) {
  const { data } = await apiClient.post(`/trips/${tripId}/days/${dayId}/activities`, input);
  return data.activity;
}

export async function updateActivityRequest(
  tripId: string,
  dayId: string,
  activityId: string,
  input: Partial<ActivityInput>
) {
  const { data } = await apiClient.patch(
    `/trips/${tripId}/days/${dayId}/activities/${activityId}`,
    input
  );
  return data.activity;
}

export async function deleteActivityRequest(tripId: string, dayId: string, activityId: string) {
  await apiClient.delete(`/trips/${tripId}/days/${dayId}/activities/${activityId}`);
}
