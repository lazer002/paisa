// src/app/api/login/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  try {
    const res = await axios.post(`${process.env.BACKEND_URL}/api/auth/login`, {
      email,
      password,
    }, {
      withCredentials: true, // allow cookies from backend (if backend sets them)
    });

    const { token, role, instituteId } = res.data;

    if (!token) {
      return NextResponse.json({ error: "No token received" }, { status: 401 });
    }

    // ✅ Set the token cookie for frontend
    const response = NextResponse.json({ role, instituteId });

    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.response?.data?.message || "Login failed" }, { status: err.response?.status || 500 });
  }
}
