// client/src/app/page.tsx
"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-900">
      <Card className="w-[380px] shadow-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Redirecting...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <Loader2 className="h-12 w-12 animate-spin text-indigo-300" />

          <p className="text-sm text-center text-white/70">
            We’re verifying your session and sending you to your dashboard.
          </p>

          <p className="text-xs text-center text-white/50">
            If nothing happens,{" "}
            <a href="/login" className="underline text-indigo-300">
              click here
            </a>{" "}
            to login manually.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
