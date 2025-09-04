// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

// Define the expected User type
interface User {
  id: string;
  name: string;
  role: string;
  email?: string; // optional if your API sends it
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    axios
      .get("/api/me")
      .then((res) => setUser(res.data.user as User)) // cast to User
      .catch(() => router.push("/login"));
  }, [router]);

  const handleLogout = async () => {
    await axios.post("/api/logout");
    router.push("/login");
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl">Welcome, {user.name} 👑</h1>
      <p className="mb-4">Role: {user.role}</p>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
