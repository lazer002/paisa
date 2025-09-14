"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "default" | "destructive";

interface ToastProps {
  id: number;
  title: string;
  description?: string;
  type?: ToastType;
}

interface ToastContextType {
  toast: (props: Omit<ToastProps, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = ({ title, description, type = "default" }: Omit<ToastProps, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded shadow-lg text-white ${
              t.type === "destructive" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            <p className="font-bold">{t.title}</p>
            {t.description && <p className="text-sm">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
