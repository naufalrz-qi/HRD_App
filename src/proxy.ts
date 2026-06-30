import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Rute publik yang tidak butuh sesi.
const PUBLIC_PATHS = ["/login"];

// Next.js 16: "middleware" kini bernama "proxy" (fungsi sama).
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Belum login → paksa ke /login (kecuali halaman publik).
  if (!session) {
    if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Sudah login tapi membuka /login → arahkan ke dashboard.
  if (pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Wajib ganti password default → kunci ke /change-password.
  if (session.mustChangePassword && pathname !== "/change-password") {
    const url = req.nextUrl.clone();
    url.pathname = "/change-password";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Lindungi semua rute halaman; kecualikan API, aset, dan file statis.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
