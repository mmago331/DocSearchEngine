import { Router } from "express";
import { z } from "zod";
import { createUser, findUserByEmail, findUserById } from "../db/user.js";
import { hashPassword, verifyPassword } from "../lib/crypto.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/register", async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  const { email, password } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash);

  const token = signToken({
    sub: user.id,
    email: user.email,
    userId: user.id,
  });
  res.status(201).json({ token, user: { id: user.id, email: user.email, created_at: user.created_at } });
});

router.post("/login", async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  const { email, password } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken({
    sub: user.id,
    email: user.email,
    userId: user.id,
  });
  res.json({ token, user: { id: user.id, email: user.email, created_at: user.created_at } });
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const user = await findUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, created_at: user.created_at });
});

export default router;
