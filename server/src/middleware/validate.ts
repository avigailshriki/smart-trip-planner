import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type Target = "body" | "query" | "params";

// Middleware גנרי: מוודא שגוף הבקשה/query/params תואמים לסכימת zod,
// ומחליף אותם בגרסה המפוענחת (עם ברירות מחדל, coercion וכו').
export function validate(schema: ZodSchema, target: Target = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(result.error);
    }
    (req as any)[target] = result.data;
    next();
  };
}
