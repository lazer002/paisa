// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// Map roles to route prefixes
const roleRouteMap: Record<string, string> = {
  super_admin: "/superadmin",
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  hr: "/hr",
  employee: "/employee",
};

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // No token → redirect to login
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
    const userRole = decoded.role;
    const { pathname } = req.nextUrl;

    // 🔐 Role-based protection
    for (const [role, prefix] of Object.entries(roleRouteMap)) {
      if (pathname.startsWith(prefix) && userRole !== role) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // Prevent logged-in users from visiting /login
    if (pathname === "/login") {
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

// ✅ Apply middleware to protected routes
export const config = {
  matcher: [
    "/",
    "/superadmin/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/hr/:path*",
    "/employee/:path*",
    "/login",
  ],
};
