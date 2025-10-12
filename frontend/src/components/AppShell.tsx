import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, type ReactNode } from "react";

type NavItemProps = {
  to: string;
  children: ReactNode;
};

function Bars3Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      {...props}
    >
      <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

export default function AppShell() {
  const loc = useLocation();
  const path = loc.pathname;

  // On auth pages, render children only (no chrome)
  if (path.startsWith("/login") || path.startsWith("/register")) {
    return <Outlet />;
  }

  const [open, setOpen] = useState(false);
  const NavItem = ({ to, children }: NavItemProps) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm ${
          isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
        }`
      }
      onClick={() => setOpen(false)}
    >
      {children}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button className="rounded-md p-2 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(v => !v)}>
            <Bars3Icon />
          </button>
          <Link to="/" className="text-lg font-semibold text-indigo-700">DocSearchEngine</Link>
          <nav className="ml-6 hidden gap-1 lg:flex">
            <NavItem to="/">Search</NavItem>
            <NavItem to="/explore">Explore</NavItem>
            <NavItem to="/admin">Admin</NavItem>
          </nav>
          <div className="ml-auto">
            {/* logout/login button handled on protected pages */}
          </div>
        </div>

        {open && (
          <div className="border-t bg-white px-4 py-2 lg:hidden">
            <div className="flex flex-col gap-1">
              <NavItem to="/">Search</NavItem>
              <NavItem to="/explore">Explore</NavItem>
              <NavItem to="/admin">Admin</NavItem>
            </div>
          </div>
        )}
      </header>

      {/* Body with left nav */}
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-6">
        <aside className="col-span-3 hidden lg:block">
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="px-3 py-2 text-sm font-semibold text-gray-700">Main</div>
            <nav className="px-2 pb-2">
              <NavItem to="/">Search</NavItem>
              <NavItem to="/explore">Explore</NavItem>
              <NavItem to="/admin">Admin</NavItem>
            </nav>
          </div>
        </aside>

        <main className="col-span-12 lg:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
