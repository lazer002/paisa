// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
console.log("Token in middleware:", token);

  // If user tries to access /dashboard without token → redirect to /login
  if (req.nextUrl.pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If logged in and tries to access /login → redirect to /dashboard
  if (req.nextUrl.pathname.startsWith("/login") && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// ✅ Apply only to certain routes
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
