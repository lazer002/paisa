import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  // ✅ Await cookies() to get the CookieStore
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  // console.log("Token in /api/me:", token);
  // console.log("cookieStore:", cookieStore);
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.json({ user: decoded });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
