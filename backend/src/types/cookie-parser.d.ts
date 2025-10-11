declare module "cookie-parser" {
  import type { RequestHandler } from "express";

  interface CookieParseOptions {
    decode?(value: string): string;
  }

  interface CookieSerializeOptions {
    path?: string;
    maxAge?: number;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: boolean | "lax" | "strict" | "none";
  }

  interface CookieParser {
    (secret?: string | string[], options?: CookieParseOptions): RequestHandler;
    JSONCookie(str: string): unknown;
    JSONCookies(cookies: Record<string, string>): Record<string, unknown>;
    signedCookie(str: string, secret?: string | string[]): string | false;
    signedCookies(cookies: Record<string, string>, secret?: string | string[]): Record<string, string>;
  }

  const cookieParser: CookieParser;
  export = cookieParser;
}
