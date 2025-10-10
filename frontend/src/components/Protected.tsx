import { Navigate } from "react-router-dom";
export function Protected({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}
export function AdminOnly({ children }: { children: JSX.Element }) {
  // TODO: swap with a real role check from /auth/me when roles exist
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}
