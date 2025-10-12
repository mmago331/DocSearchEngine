import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { Protected, AdminOnly } from "@/components/Protected";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import Library from "@/pages/Library";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminShell from "@/components/AdminShell";

export default function App() {
  return (
    <Routes>
      {/* Auth pages – bare layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* App layout – protected */}
      <Route element={<AppShell />}>
        <Route
          path="/"
          element={(
            <Protected>
              <Home />
            </Protected>
          )}
        />
        <Route
          path="/library"
          element={(
            <Protected>
              <Library />
            </Protected>
          )}
        />
        <Route
          path="/explore"
          element={(
            <Protected>
              <Explore />
            </Protected>
          )}
        />
        <Route
          path="/admin/*"
          element={(
            <AdminOnly>
              <AdminShell />
            </AdminOnly>
          )}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
