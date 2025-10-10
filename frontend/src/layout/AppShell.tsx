import { NavLink, Link } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { Button } from "@/ui/primitives";

const navMain = [
  { to: "/", label: "Search" },
  { to: "/library", label: "Library", auth: true },
  { to: "/explore", label: "Explore" }
];
const navAdmin = [
  { to: "/admin", label: "Dashboard", end: true, auth: true },
  { to: "/admin/documents", label: "Documents", auth: true }
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const authed = !!localStorage.getItem("token");
  const logout = () => { localStorage.removeItem("token"); window.location.href = "/login"; };

  const Item = ({ to, label, end = false }: any) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm ${isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`
      }
      onClick={() => setOpen(false)}
    >
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button className="rounded-md p-2 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(s => !s)}>☰</button>
          <Link to="/" className="text-lg font-semibold text-indigo-700">DocSearchEngine</Link>
          <div className="ml-4 hidden lg:flex lg:items-center lg:gap-1">
            {navMain.map(i => (!i.auth || authed) && <Item key={i.to} {...i} />)}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link className="text-sm text-gray-600 hover:text-gray-900" to="/admin">Admin</Link>
            {authed
              ? <Button variant="ghost" onClick={logout}>Logout</Button>
              : <Link className="text-sm text-indigo-700 hover:underline" to="/login">Login</Link>}
          </div>
        </div>
      </div>

      {/* Body with sidebar */}
      <div className="mx-auto flex max-w-7xl">
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r bg-white p-3 transition-transform lg:static
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="mb-2 px-2 text-xs font-semibold text-gray-500">Main</div>
          <nav className="mb-4 space-y-1">{navMain.map(i => (!i.auth || authed) && <Item key={i.to} {...i} />)}</nav>
          <div className="mb-2 px-2 text-xs font-semibold text-gray-500">Admin</div>
          <nav className="space-y-1">{navAdmin.map(i => (!i.auth || authed) && <Item key={i.to} {...i} />)}</nav>
        </aside>
        <main className="min-h-[calc(100vh-56px)] w-full p-4 lg:ml-0">{children}</main>
      </div>
    </div>
  );
}
