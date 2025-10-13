import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("4000"),
  DATABASE_URL: z
    .string()
    .default("postgres://docsearch:docsearch@localhost:5432/docsearch"),
  // Session + admin creds (mirror Proxy)
  SESSION_SECRET: z.string().min(12).default("please_change_me"),
  ADMIN_USER: z.string().default("admin@example.com"),
  ADMIN_PASS: z.string().default("change_me"),
});

export const env = envSchema.parse(process.env);
