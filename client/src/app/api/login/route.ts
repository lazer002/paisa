// src/app/api/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // ✅ simple hardcoded check (replace with DB later)
  if (email !== "admin@example.com" || password !== "password123") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // 🔐 sign JWT
  const token = jwt.sign(
    { id: 1, name: "Ajit Kumar", role: "Superadmin" },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );

  // set cookie
  (await cookies()).set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.json({ success: true });
}
