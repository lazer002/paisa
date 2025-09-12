// client/src/app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export default async function HomePage() {
  const token = (await cookies()).get("token")?.value;

  if (!token) redirect("/login");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { role: string };

    // Map roles to their respective routes
    const roleRouteMap: Record<string, string> = {
      super_admin: "/dashboard",
      admin: "/admin",
      teacher: "/teacher",
      student: "/student",
      hr: "/hr",
      employee: "/employee",
    };

    const redirectPath = roleRouteMap[decoded.role] || "/dashboard";
    redirect(redirectPath);

  } catch {
    redirect("/login");
  }
}
