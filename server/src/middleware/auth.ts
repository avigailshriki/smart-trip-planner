import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";

// מרחיבים את טיפוס Request כדי לצרף את זהות המשתמש המחובר
declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; email: string };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing or invalid Authorization header"));
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyToken(token);
    req.auth = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    next(AppError.unauthorized("Invalid or expired token"));
  }
}
