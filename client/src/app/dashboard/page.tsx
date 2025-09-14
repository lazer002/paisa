// src/app/dashboard/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowUp, ArrowDown, School, Building2, Users } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { title: "Institutes", value: 12, icon: <School className="w-6 h-6 text-blue-500" /> },
    { title: "Companies", value: 8, icon: <Building2 className="w-6 h-6 text-green-500" /> },
    { title: "Users", value: 120, icon: <Users className="w-6 h-6 text-purple-500" /> },
  ];

  return (
    <>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">Active {stat.title}</p>
            </CardContent>
            <CardFooter className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500">+5 this month</span>
            </CardFooter>
          </Card>
        ))}
      </div>
      </>

  );
}
