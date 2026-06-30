// Modul sesi berbasis jose — EDGE-SAFE (dipakai middleware & route handler).
// Tidak mengimpor node:crypto / prisma agar bisa jalan di edge runtime.
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/types";

export const SESSION_COOKIE = "session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 hari

export interface SessionPayload {
  userId: number;
  role: Role;
  email: string;
  nama: string;
  mustChangePassword: boolean;
}

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
  return new TextEncoder().encode(s);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: payload.userId as number,
      role: payload.role as Role,
      email: payload.email as string,
      nama: payload.nama as string,
      mustChangePassword: payload.mustChangePassword as boolean,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SEC,
};
