import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export default async function HomePage() {
  const token = (await cookies()).get("token")?.value;

  if (!token) redirect("/login");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { role: string };

    switch (decoded.role) {
      case "super_admin":
        redirect("/dashboard");
      case "admin":
        redirect("/admin");
      case "teacher":
        redirect("/teacher");
      case "student":
        redirect("/student");
      case "hr":
        redirect("/hr");
      case "employee":
        redirect("/employee");
      default:
        redirect("/dashboard");
    }
  } catch {
    redirect("/login");
  }
}
