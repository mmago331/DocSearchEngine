import { Navigate, Route, Routes } from "react-router-dom";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Search from "@/pages/Search";
import Explore from "@/pages/Explore";
import Library from "@/pages/Library";
import DocumentPage from "@/pages/DocumentPage";
import Admin from "@/pages/Admin";
import AppLayout from "@/layouts/AppLayout";
import RequireAuth from "@/routes/RequireAuth";

export default function App() {
  return (
    <Routes>
      {/* public auth pages (no AppShell) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* protected app (wrapped in AppShell) */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<Search />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/library" element={<Library />} />
          <Route path="/documents/:id" element={<DocumentPage />} />
          <Route path="/admin/*" element={<Admin />} />
        </Route>
      </Route>

      {/* default landing */}
      <Route path="*" element={<Navigate to="/search" replace />} />
    </Routes>
  );
}
