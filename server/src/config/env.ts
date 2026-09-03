import "dotenv/config";
import { z } from "zod";

// סכימת ולידציה למשתני הסביבה - השרת לא יעלה אם חסר משהו קריטי
const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(10, "JWT_SECRET must be set to a long random string"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  GOOGLE_PLACES_API_KEY: z.string().optional().default(""),
  OPENWEATHER_API_KEY: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
