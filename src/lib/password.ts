// Hashing password kompatibel Werkzeug — NODE-only, tanpa import Next.
// Bisa dipakai di route handler maupun script (seed) lewat tsx.
import { randomBytes, scryptSync, pbkdf2Sync, timingSafeEqual } from "node:crypto";

// scrypt butuh memori ~128*N*r byte; longgarkan maxmem agar tidak error.
const SCRYPT_MAXMEM = 192 * 1024 * 1024;

/**
 * Verifikasi password terhadap hash format Werkzeug.
 * Mendukung "scrypt:N:r:p$salt$hex" (default Werkzeug 3) & "pbkdf2:sha256:iter$salt$hex".
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [method, salt, expectedHex] = stored.split("$");
    if (!method || !salt || !expectedHex) return false;

    const parts = method.split(":");
    let derivedHex: string;

    if (parts[0] === "scrypt") {
      const N = Number(parts[1] ?? 32768);
      const r = Number(parts[2] ?? 8);
      const p = Number(parts[3] ?? 1);
      const keylen = expectedHex.length / 2;
      derivedHex = scryptSync(password, salt, keylen, { N, r, p, maxmem: SCRYPT_MAXMEM }).toString("hex");
    } else if (parts[0] === "pbkdf2") {
      const digest = parts[1] ?? "sha256";
      const iterations = Number(parts[2] ?? 600000);
      const keylen = expectedHex.length / 2;
      derivedHex = pbkdf2Sync(password, salt, iterations, keylen, digest).toString("hex");
    } else {
      return false;
    }

    const a = Buffer.from(derivedHex, "hex");
    const b = Buffer.from(expectedHex, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Buat hash format Werkzeug scrypt (default N=32768,r=8,p=1,dklen=64). */
export function hashPassword(password: string): string {
  const N = 32768;
  const r = 8;
  const p = 1;
  const salt = randomBytes(12).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
  const hex = scryptSync(password, salt, 64, { N, r, p, maxmem: SCRYPT_MAXMEM }).toString("hex");
  return `scrypt:${N}:${r}:${p}$${salt}$${hex}`;
}
