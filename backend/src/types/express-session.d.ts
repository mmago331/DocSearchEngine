declare module "express-session" {
  import { RequestHandler } from "express";

  interface CookieOptions {
    httpOnly?: boolean;
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
    path?: string;
  }

  interface SessionData {
    user?: string;
    [key: string]: any;
  }

  interface Session {
    destroy(callback: (err?: unknown) => void): void;
    user?: string;
    [key: string]: any;
  }

  interface SessionOptions {
    secret: string;
    resave?: boolean;
    saveUninitialized?: boolean;
    cookie?: CookieOptions;
  }

  const session: (options: SessionOptions) => RequestHandler;
  export default session;
}

declare module "express-serve-static-core" {
  interface Request {
    session: import("express-session").Session & import("express-session").SessionData;
  }
}
