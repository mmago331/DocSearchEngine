import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function RequireAuth() {
  const [status, setStatus] = useState<"checking" | "authed" | "anon">("checking");

  useEffect(() => {
    fetch("/auth/me", { credentials: "include" })
      .then(r => setStatus(r.ok ? "authed" : "anon"))
      .catch(() => setStatus("anon"));
  }, []);

  if (status === "checking") return null;
  if (status === "anon") return <Navigate to="/login" replace />;
  return <Outlet />;
}
