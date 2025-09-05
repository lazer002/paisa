// src/app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export default async function HomePage() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    redirect("/login"); // not logged in → login
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      role: string;
    };

    // 🔀 Role-based redirects
    if (decoded.role === "Superadmin") {
      redirect("/dashboard");
    }
    if (decoded.role === "Teacher") {
      redirect("/teacher/home");
    }
    if (decoded.role === "Student") {
      redirect("/student/home");
    }

    // fallback if role not recognized
    redirect("/dashboard");
  } catch {
    redirect("/login");
  }
}
