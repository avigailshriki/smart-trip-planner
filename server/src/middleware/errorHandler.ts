import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

// Wrapper כדי לא לחזור על try/catch בכל route async
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}` } });
}

// Middleware שגיאה גלובלי - חייב 4 פרמטרים כדי ש-Express יזהה אותו ככזה
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.flatten(),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details,
      },
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: {
      message: "Internal server error",
      ...(env.NODE_ENV === "development" && err instanceof Error
        ? { stack: err.stack }
        : {}),
    },
  });
}
