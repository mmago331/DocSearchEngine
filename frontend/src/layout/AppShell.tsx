import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, type ReactNode } from "react";

type AppShellProps = {
  children?: ReactNode;
};

const AUTH_ROUTES = new Set(["/login", "/register"]);

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (AUTH_ROUTES.has(location.pathname.toLowerCase())) {
    return <Outlet />;
  }

  const Item = ({ to, children: itemChildren }: { to: string; children: ReactNode }) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `block rounded px-3 py-2 text-sm ${isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"}`
      }
      onClick={() => setOpen(false)}
    >
      {itemChildren}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button className="rounded-md p-2 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(v => !v)}>☰</button>
          <Link to="/search" className="text-lg font-semibold text-indigo-700">DocSearchEngine</Link>
          <nav className="ml-4 hidden gap-1 lg:flex">
            <Item to="/search">Search</Item>
            <Item to="/explore">Explore</Item>
            <Item to="/library">Library</Item>
            <Item to="/admin">Admin</Item>
          </nav>
        </div>
        {open && (
          <div className="border-t bg-white px-4 py-2 lg:hidden">
            <Item to="/search">Search</Item>
            <Item to="/explore">Explore</Item>
            <Item to="/library">Library</Item>
            <Item to="/admin">Admin</Item>
          </div>
        )}
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-6">
        <aside className="col-span-3 hidden lg:block">
          <div className="rounded-xl border bg-white">
            <div className="px-3 py-2 text-sm font-semibold text-gray-700">Main</div>
            <nav className="px-2 pb-2">
              <Item to="/search">Search</Item>
              <Item to="/explore">Explore</Item>
              <Item to="/library">Library</Item>
              <Item to="/admin">Admin</Item>
            </nav>
          </div>
        </aside>
        <main className="col-span-12 lg:col-span-9">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
