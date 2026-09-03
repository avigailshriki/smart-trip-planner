import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { users } from "../db/schema";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { signToken } from "../utils/jwt";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function toPublicUser(user: { id: string; email: string; name: string }) {
  return { id: user.id, email: user.email, name: user.name };
}

authRouter.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body as z.infer<typeof registerSchema>;

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
    if (existing) {
      throw AppError.conflict("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({ name, email: email.toLowerCase(), passwordHash })
      .returning();

    const token = signToken({ userId: user.id, email: user.email });
    res.status(201).json({ token, user: toPublicUser(user) });
  })
);

authRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
    if (!user) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: toPublicUser(user) });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.auth!.userId),
    });
    if (!user) throw AppError.notFound("User not found");
    res.json({ user: toPublicUser(user) });
  })
);
