import jwt from "jsonwebtoken";
import { env } from "@/lib/env";

export type JwtPayload = { userId: string };

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { algorithm: "HS256", expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
