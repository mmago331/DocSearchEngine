import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AppShell from "./layout/AppShell";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Library from "./pages/Library";
import DocumentPage from "./pages/DocumentPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/admin/Dashboard";
import AdminDocuments from "./pages/admin/Documents";
import { Protected, AdminOnly } from "./components/Protected";

function ProtectedAppShell() {
  return (
    <Protected>
      <AppShell>
        <Outlet />
      </AppShell>
    </Protected>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedAppShell />}>
        <Route index element={<Home />} />
        <Route path="library" element={<Library />} />
        <Route path="explore" element={<Explore />} />
        <Route path="documents/:id" element={<DocumentPage />} />
        <Route
          path="admin"
          element={(
            <AdminOnly>
              <Dashboard />
            </AdminOnly>
          )}
        />
        <Route
          path="admin/documents"
          element={(
            <AdminOnly>
              <AdminDocuments />
            </AdminOnly>
          )}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
