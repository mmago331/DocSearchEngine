import jwt from "jsonwebtoken";
import { env } from "@/lib/env";

export type JwtPayload = { sub: string; email: string };

export function signToken(payload: JwtPayload, expiresIn = "7d") {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
