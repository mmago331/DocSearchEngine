import React, { createContext, useContext, useState, useCallback } from "react";

type Toast = { id: string; text: string; tone?: "info"|"success"|"error" };
const Ctx = createContext<{ push: (t: Omit<Toast,"id">)=>void }>({ push: ()=>{} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast,"id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(x => [...x, { id, ...t }]);
    setTimeout(() => setToasts(x => x.filter(y => y.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex flex-col items-center gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto rounded-lg px-3 py-2 text-sm shadow-md
            ${t.tone === "success" ? "bg-emerald-600 text-white"
              : t.tone === "error" ? "bg-red-600 text-white"
              : "bg-gray-800 text-white"}`}>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
