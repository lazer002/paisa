"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { ToastProvider } from "@/components/ui/use-toast";
import { getMe } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store";

// 🔥 Auth sync
function AuthInitializer() {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    getMe()
      .then((res) => login(res.data))
      .catch(() => logout());
  }, []);

  return null;
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}