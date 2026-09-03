import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { tripsRouter } from "./routes/trips.routes";
import { mediaRouter } from "./routes/media.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  // crossOriginResourcePolicy מוגדר ל-"cross-origin" כדי שהלקוח (פורט 5173)
  // יוכל לטעון את תמונות הרקע מהשרת (פורט 4000) - שני פורטים שונים = origin שונה.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

  // תמונות סטטיות (כרגע: תמונות הרקע להתחברות/הרשמה) - server/public/** נגיש דרך /images/**
  app.use("/images", express.static(path.join(__dirname, "..", "public")));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/trips", tripsRouter);
  app.use("/api", mediaRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
