import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "@/pages/admin/Dashboard";
import AdminDocuments from "@/pages/admin/Documents";

export default function Admin() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="documents" element={<AdminDocuments />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
