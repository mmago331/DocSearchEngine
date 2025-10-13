import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@/layout/AppShell";
import Admin from "@/pages/Admin";
import DocumentPage from "@/pages/DocumentPage";
import Explore from "@/pages/Explore";
import Library from "@/pages/Library";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Search from "@/pages/Search";

const isAuthed = () => !!localStorage.getItem("token");

const AuthedShell = () => (isAuthed() ? <AppShell /> : <Navigate to="/login" replace />);

export default function App() {
  return (
    <Routes>
      {/* auth routes render without the shell */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* default landing: go to login if not authed; else to /search */}
      <Route index element={<Navigate to={isAuthed() ? "/search" : "/login"} replace />} />

      {/* application routes behind the shell */}
      <Route element={<AuthedShell />}>
        <Route path="/search" element={<Search />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/library" element={<Library />} />
        <Route path="/documents/:id" element={<DocumentPage />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="*" element={<Navigate to="/search" replace />} />
      </Route>
    </Routes>
  );
}
