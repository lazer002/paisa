// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // No token → always send to login
  if (!token) {
    if (req.nextUrl.pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      role: string;
    };

    const { pathname } = req.nextUrl;

    // 🔐 Role-based route protection
    if (pathname.startsWith("/superadmin") && decoded.role !== "Superadmin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/admin") && decoded.role !== "Admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/teacher") && decoded.role !== "Teacher") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/student") && decoded.role !== "Student") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Prevent logged-in users from visiting /login again
    if (pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid/expired token → force logout
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("token");
    return res;
  }
}

// ✅ Apply to all protected routes
export const config = {
  matcher: [
    "/",
    "/superadmin/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/login",
  ],
};
