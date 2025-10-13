import { Link, NavLink, Outlet } from "react-router-dom";
import { useState, type ReactNode } from "react";

type AppShellProps = { children?: ReactNode };

export default function AppShell({ children }: AppShellProps) {
  const [open, setOpen] = useState(false);

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

  const handleLogout = async () => {
    try {
      await fetch("/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      window.location.href = "/login";
    }
  };

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
              onClick={() => void handleLogout()}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Body with sidebar */}
      <div className="mx-auto flex max-w-7xl">
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 border-r bg-white p-3 transition-transform lg:static ${
            open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <nav className="grid gap-1">
            <Item to="/search">Search</Item>
            <Item to="/explore">Explore</Item>
            <Item to="/library">Library</Item>
          </nav>
        </aside>
        <main className="mx-auto w-full max-w-7xl p-4">
          <Outlet />
          {children}
        </main>
      </div>
    </div>
  );
}
