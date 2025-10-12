// frontend/src/App.tsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AppShell from "@/layout/AppShell";
import { Protected, AdminOnly } from "@/components/Protected";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Explore from "@/pages/Explore";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/admin/Dashboard";
import AdminDocuments from "@/pages/admin/Documents";

// Wrap "app" routes in the shell; auth routes stay outside so no nav/sidebar is shown there
function AppFrame() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public auth routes: render without AppShell */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Application routes use AppShell and require auth */}
      <Route element={<AppFrame />}>
        <Route path="/" element={<Protected><Home /></Protected>} />
        <Route path="/library" element={<Protected><Library /></Protected>} />
        <Route path="/explore" element={<Protected><Explore /></Protected>} />
        <Route path="/admin" element={<AdminOnly><Dashboard /></AdminOnly>} />
        <Route path="/admin/documents" element={<AdminOnly><AdminDocuments /></AdminOnly>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
