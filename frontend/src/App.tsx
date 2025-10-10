import { Routes, Route, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { Protected, AdminOnly } from "@/components/Protected";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Explore from "@/pages/Explore";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminShell from "@/components/AdminShell";
import Dashboard from "@/pages/admin/Dashboard";
import AdminDocuments from "@/pages/admin/Documents";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Protected><Library /></Protected>} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={<AdminOnly><AdminShell /></AdminOnly>}>
          <Route index element={<Dashboard />} />
          <Route path="documents" element={<AdminDocuments />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
