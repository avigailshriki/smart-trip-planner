import { Router } from "express";
import fs from "fs";
import path from "path";
import { asyncHandler } from "../middleware/errorHandler";

export const mediaRouter = Router();

// server/public/backgrounds - תיקייה שאליה מכניסים תמונות רקע (jpg/png/webp/gif).
// מוגשת סטטית תחת /images/backgrounds/<filename> (ראה app.ts).
const BACKGROUNDS_DIR = path.join(__dirname, "..", "..", "public", "backgrounds");
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/**
 * GET /api/background-images
 * מחזיר את רשימת קבצי התמונה שנמצאים כרגע בתיקיית server/public/backgrounds,
 * כדי שהלקוח יוכל להציג אותן ברקע מסכי ההתחברות/הרשמה בלי שינוי קוד -
 * פשוט מוסיפים/מסירים קבצים בתיקייה והרשימה מתעדכנת אוטומטית בכל בקשה.
 */
mediaRouter.get(
  "/background-images",
  asyncHandler(async (_req, res) => {
    let files: string[] = [];
    try {
      files = fs.readdirSync(BACKGROUNDS_DIR);
    } catch {
      files = []; // התיקייה עוד לא קיימת / ריקה - לא שגיאה, פשוט אין תמונות עדיין
    }

    const images = files
      .filter((file) => ALLOWED_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .sort()
      .map((file) => `/images/backgrounds/${encodeURIComponent(file)}`);

    res.json({ images });
  })
);
