import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const roleRouteMap: Record<string, string> = {
  super_admin: "/dashboard",
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  hr: "/hr",
  employee: "/employee",
};

const protectedRoutes: Record<string, string[]> = {
  "/dashboard": ["super_admin"],
  "/admin": ["admin"],
  "/teacher": ["teacher"],
  "/student": ["student"],
  "/hr": ["hr"],
  "/employee": ["employee"],
};

async function verifyToken(token: string): Promise<{ role: string; id: string } | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    if (!payload.role || !payload.id) return null;
    return { role: payload.role as string, id: payload.id as string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  // No token → redirect to login (except already on /login)
  if (!token) {
    if (pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify signature — reject forged tokens
  const payload = await verifyToken(token);

  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("token");
    return res;
  }

  const { role } = payload;
  const roleHome = roleRouteMap[role] || "/login";

  // Already logged in → redirect away from /login
  if (pathname === "/login" || pathname === "/") {
    return NextResponse.redirect(new URL(roleHome, req.url));
  }

  // Role-based route guard
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL(roleHome, req.url));
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
