import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/layout/AppShell";
import { Protected, AdminOnly } from "@/components/Protected";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Explore from "@/pages/Explore";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/admin/Dashboard";
import AdminDocuments from "@/pages/admin/Documents";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Protected><Library /></Protected>} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminOnly><Dashboard /></AdminOnly>} />
        <Route path="/admin/documents" element={<AdminOnly><AdminDocuments /></AdminOnly>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
