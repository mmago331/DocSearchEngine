import { Outlet } from "react-router-dom";
import AppShell from "@/layout/AppShell";

export default function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
