// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Map each role to its default route
const roleRouteMap: Record<string, string> = {
  super_admin: "/dashboard",
  teacher: "/teacher/home",
  student: "/student/home",
  hr: "/hr/home",
  employee: "/employee/home",
  admin: "/admin/home",
};

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value; // save role cookie on login

  const { pathname } = req.nextUrl;

  // 1️⃣ Redirect unauthenticated users to /login
  if (!token) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // 2️⃣ Protect role-specific routes
  if (role) {
    for (const [r, prefix] of Object.entries(roleRouteMap)) {
      if (pathname.startsWith(prefix) && role !== r) {
        // redirect unauthorized role to its default page
        const redirectPath = roleRouteMap[role] || "/";
        return NextResponse.redirect(new URL(redirectPath, req.url));
      }
    }
  }

  // 3️⃣ Prevent logged-in users from visiting /login
  if (pathname === "/login") {
    const redirectPath = role ? roleRouteMap[role] || "/" : "/";
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  return NextResponse.next();
}

// Apply middleware only to these routes
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/hr/:path*",
    "/employee/:path*",
    "/admin/:path*",
    "/login",
  ],
};
