// Modul auth NODE-ONLY: helper sesi server (hashing ada di ./password).
import { cookies } from "next/headers";
import type { Role } from "@/types";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "./session";

export { verifyPassword, hashPassword } from "./password";

/** Ambil sesi dari cookie (null bila tidak login / token invalid). */
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Pastikan login; lempar 401 bila tidak. */
export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new AuthError(401, "Tidak terautentikasi.");
  return s;
}

/** Pastikan login + role termasuk daftar; lempar 403 bila tidak berwenang. */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const s = await requireSession();
  if (!roles.includes(s.role)) throw new AuthError(403, "Anda tidak memiliki akses.");
  return s;
}

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
