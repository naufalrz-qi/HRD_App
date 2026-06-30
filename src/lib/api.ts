import { NextResponse } from "next/server";
import { AuthError } from "./auth";

/** Bungkus handler agar AuthError & error lain jadi JSON response rapi. */
export async function handle<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const data = await fn();
    return NextResponse.json(data ?? { ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("API error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

/** Error domain dengan status (mis. validasi 400, konflik 409). */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
