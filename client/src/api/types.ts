export type BudgetLevel = "LOW" | "MEDIUM" | "HIGH";
export type TripStatus = "DRAFT" | "GENERATING" | "READY" | "FAILED";
export type ActivitySource = "AI" | "PLACES" | "MANUAL";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Trip {
  id: string;
  userId: string;
  destinationName: string;
  destinationLat: number | null;
  destinationLng: number | null;
  startDate: string;
  endDate: string;
  budgetLevel: BudgetLevel;
  interests: string[];
  status: TripStatus;
  generationError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  tripDayId: string;
  orderIndex: number;
  name: string;
  description: string | null;
  category: string | null;
  placeId: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  startTime: string | null;
  durationMinutes: number | null;
  estimatedCostUsd: number | null;
  source: ActivitySource;
}

export interface TripDay {
  id: string;
  tripId: string;
  dayIndex: number;
  date: string;
  summary: string | null;
  activities: Activity[];
}

export interface TripWithItinerary extends Trip {
  days: TripDay[];
}

export const INTEREST_OPTIONS = [
  { value: "history", label: "היסטוריה" },
  { value: "food", label: "אוכל" },
  { value: "nature", label: "טבע" },
  { value: "art", label: "אמנות" },
  { value: "nightlife", label: "חיי לילה" },
  { value: "shopping", label: "קניות" },
  { value: "family", label: "משפחות" },
  { value: "adventure", label: "הרפתקאות" },
] as const;
