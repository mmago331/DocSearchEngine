import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "@/layout/AppShell";
import Admin from "@/pages/Admin";
import DocumentPage from "@/pages/DocumentPage";
import Explore from "@/pages/Explore";
import Library from "@/pages/Library";
import Search from "@/pages/Search";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/search" replace />} />
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
