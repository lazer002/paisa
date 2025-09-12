// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  const role = req.cookies.get("role")?.value; // 👈 save role in login route

  const { pathname } = req.nextUrl;

  if (!token) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Protect role-based routes
  if (role) {
    for (const [r, prefix] of Object.entries(roleRouteMap)) {
      if (pathname.startsWith(prefix) && role !== r) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  // Prevent logged-in users from visiting /login
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

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
