import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken'
import { env } from './env.js'

/**
 * Narrow the secret to a proper `Secret` so TS picks the correct sign() overload.
 * env.JWT_SECRET is validated elsewhere; this assertion is safe here.
 */
const SECRET: Secret = env.JWT_SECRET as unknown as Secret

export type TokenPayload = JwtPayload & {
  userId: string
  // add other claims you use, e.g. role, email, etc.
}

/**
 * Sign a JWT with sane defaults. Override expiresIn per call if needed.
 */
export function signToken(
  payload: TokenPayload,
  options: SignOptions = { expiresIn: '7d' }
): string {
  return jwt.sign(payload, SECRET, options)
}

/**
 * Verify a JWT and return a typed payload.
 */
export function verifyToken<T extends object = TokenPayload>(token: string): T {
  return jwt.verify(token, SECRET) as T
}
