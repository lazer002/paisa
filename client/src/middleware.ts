import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const roleRouteMap: Record<string, string> = {
  super_admin: "/dashboard",
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  hr: "/hr",
  employee: "/employee",
};

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

  if (token && !role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!token) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.redirect(
      new URL(roleRouteMap[role!] || "/dashboard", req.url)
    );
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(roleRouteMap[role!] || "/dashboard", req.url)
    );
  }

  // Role-based route protection
  const protectedRoutes: Record<string, string[]> = {
    "/dashboard": ["super_admin"],
    "/admin": ["admin"],
    "/teacher": ["teacher"],
    "/student": ["student"],
    "/hr": ["hr"],
    "/employee": ["employee"],
  };

  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route) && !allowedRoles.includes(role!)) {
      return NextResponse.redirect(
        new URL(roleRouteMap[role!] || "/login", req.url)
      );
    }
  }

  return NextResponse.next();
}

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
