"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface User {
  userId: string;
  role: string;
  instituteId?: string | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/me", { withCredentials: true });
        console.log("Response from /api/me:", res);
        const userData = res.data.user;

        setUser(userData);

        // Optional: Redirect by role if user lands on /dashboard
        if (userData.role === "teacher") router.push("/teacher/home");
        else if (userData.role === "student") router.push("/student/home");
        // super_admin stays on /dashboard

      } catch {
        router.push("/login"); // token invalid or missing
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) return <p>Loading...</p>;
  if (!user) return null; // just in case

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {user.role}</h1>
      <p>User ID: {user.userId}</p>
      {user.instituteId && <p>Institute ID: {user.instituteId}</p>}
    </div>
  );
}
