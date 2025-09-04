// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  // @ts-expect-error TypeScript type issue with cookies()
  const token = cookies().get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    user: { id: 1, name: "Ajit Kumar", role: "Superadmin" },
  });
}
