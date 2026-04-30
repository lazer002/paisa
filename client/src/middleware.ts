// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Role → default route
const roleRouteMap: Record<string, string> = {
  super_admin: "/dashboard",
  admin: "/admin/home",
  teacher: "/teacher/home",
  student: "/student/home",
  hr: "/hr/home",
  employee: "/employee/home",
};

// 🔐 Extract role from JWT (no verify - edge safe)
function getRoleFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    return payload.role || null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  const role = token ? getRoleFromToken(token) : null;

  // 🔴 Invalid token → force logout
  if (token && !role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🔴 Not authenticated
  if (!token) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // 🟢 Logged in → block login page
  if (pathname === "/login") {
    return NextResponse.redirect(
      new URL(roleRouteMap[role!] || "/dashboard", req.url)
    );
  }

  // 🟢 Root redirect
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(roleRouteMap[role!] || "/dashboard", req.url)
    );
  }

  // 🔐 Role-based route protection
  for (const [r, route] of Object.entries(roleRouteMap)) {
    if (pathname.startsWith(route) && role !== r) {
      return NextResponse.redirect(
        new URL(roleRouteMap[role!] || "/dashboard", req.url)
      );
    }
  }

  return NextResponse.next();
}

// Apply only where needed
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/hr/:path*",
    "/employee/:path*",
    "/login",
  ],
};