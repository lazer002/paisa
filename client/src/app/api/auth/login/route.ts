// src/app/api/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // Mock login (later replace with DB)
  if (email === "admin@example.com" && password === "password123") {
    const res = NextResponse.json({ success: true });

    // Set cookie (mock token for now)
    res.cookies.set("token", "mock-jwt-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    return res;
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
