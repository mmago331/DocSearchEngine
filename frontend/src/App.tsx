import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/layout/AppShell";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import Library from "@/pages/Library";
import DocumentPage from "@/pages/DocumentPage";
import Dashboard from "@/pages/admin/Dashboard";
import AdminDocuments from "@/pages/admin/Documents";
import { getMe, type User } from "@/lib/auth";

function Protected({ children }: { children: JSX.Element }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    getMe()
      .then((u) => setUser(u))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <Protected>
              <Routes>
                <Route path="/" element={<Navigate to="/search" replace />} />
                <Route path="/search" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/library" element={<Library />} />
                <Route path="/documents/:id" element={<DocumentPage />} />
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/documents" element={<AdminDocuments />} />
                <Route path="*" element={<Navigate to="/search" replace />} />
              </Routes>
            </Protected>
          }
        />
      </Route>
    </Routes>
  );
}
