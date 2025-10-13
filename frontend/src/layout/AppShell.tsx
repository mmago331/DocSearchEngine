import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, type ReactNode } from "react";

type AppShellProps = { children?: ReactNode };

// Treat these as no-chrome routes (defensive; App mounts keeps them outside too)
const AUTH_ROUTES = new Set(["/login", "/register"]);

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // If someone ever nests auth pages under the shell by mistake, render them bare.
  if (AUTH_ROUTES.has(location.pathname.toLowerCase())) {
    return <Outlet />;
  }

  const Item = ({ to, children: itemChildren }: { to: string; children: ReactNode }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm ${isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`
      }
      onClick={() => setOpen(false)}
    >
      {itemChildren}
    </NavLink>
  );

  // Top bar + sidebar chrome for the authenticated application
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button className="rounded-md p-2 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(s => !s)}>☰</button>
          <Link to="/" className="text-lg font-semibold text-indigo-700">DocSearchEngine</Link>
          <div className="ml-auto flex items-center gap-2">
            <Link className="text-sm text-gray-600 hover:text-gray-900" to="/admin">Admin</Link>
            <button
              className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Body with sidebar */}
      <div className="mx-auto flex max-w-7xl">
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r bg-white p-3 transition-transform lg:static ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} />
        <main className="mx-auto w-full max-w-7xl p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
