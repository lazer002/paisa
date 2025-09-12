"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface User {
  userId: string;
  role: string;
  instituteId?: string | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/me", { withCredentials: true });
        setUser(res.data.user); // just save user info for display
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>No user data available</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {user.role}</h1>
      <p>User ID: {user.userId}</p>
      {user.instituteId && <p>Institute ID: {user.instituteId}</p>}
    </div>
  );
}
