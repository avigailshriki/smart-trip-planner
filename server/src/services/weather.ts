import { env } from "../config/env";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";

const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

export interface DailyWeatherSummary {
  date: string; // "YYYY-MM-DD"
  minTemp: number;
  maxTemp: number;
  condition: string; // "clear sky", "light rain", ...
  icon: string;
}

/**
 * שולף תחזית עבור טווח תאריכי הטיול.
 * הערה: ה-API החינמי של OpenWeatherMap (/data/2.5/forecast) חוזה עד 5 ימים קדימה
 * ב"פסיעות" של 3 שעות. עבור ימים שמעבר לטווח הזה נחזיר מערך ריק לאותו יום,
 * וה-AI ייצור מסלול בלי להתבסס על תחזית (לוגיקה גנרית לפי עונה/יעד).
 */
export async function getForecastSummary(
  lat: number,
  lng: number,
  startDate: Date,
  endDate: Date
): Promise<DailyWeatherSummary[]> {
  if (!env.OPENWEATHER_API_KEY) {
    console.warn("OPENWEATHER_API_KEY not configured - skipping weather lookup");
    return [];
  }

  const url = `${FORECAST_URL}?lat=${lat}&lon=${lng}&units=metric&appid=${env.OPENWEATHER_API_KEY}`;

  try {
    const res = await fetchWithTimeout(url);
    const data = (await res.json()) as any;

    if (data.cod !== "200" && data.cod !== 200) {
      console.warn(`OpenWeatherMap error: ${data.message}`);
      return [];
    }

    const byDate = new Map<string, { temps: number[]; conditions: string[]; icons: string[] }>();

    for (const entry of data.list ?? []) {
      const date = new Date(entry.dt * 1000);
      const dateKey = date.toISOString().slice(0, 10);

      if (date < startDate || date > endDate) continue;

      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, { temps: [], conditions: [], icons: [] });
      }
      const bucket = byDate.get(dateKey)!;
      bucket.temps.push(entry.main.temp);
      bucket.conditions.push(entry.weather?.[0]?.description ?? "");
      bucket.icons.push(entry.weather?.[0]?.icon ?? "");
    }

    const summaries: DailyWeatherSummary[] = [];
    for (const [date, bucket] of byDate.entries()) {
      summaries.push({
        date,
        minTemp: Math.round(Math.min(...bucket.temps)),
        maxTemp: Math.round(Math.max(...bucket.temps)),
        condition: mostCommon(bucket.conditions),
        icon: mostCommon(bucket.icons),
      });
    }

    return summaries.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.warn("Weather lookup failed:", err);
    return [];
  }
}

function mostCommon(items: string[]): string {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  let best = items[0] ?? "";
  let bestCount = 0;
  for (const [item, count] of counts.entries()) {
    if (count > bestCount) {
      best = item;
      bestCount = count;
    }
  }
  return best;
}
