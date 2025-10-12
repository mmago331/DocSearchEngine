// frontend/src/layout/AppShell.tsx
import { ReactNode, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

const Bars3Icon = (props: React.SVGProps<SVGSVGElement>) => (
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

const items = [
  { to: "/", label: "Search", end: true },
  { to: "/explore", label: "Explore" },
  { to: "/admin", label: "Admin" }
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const authed = !!localStorage.getItem("token");
  const { pathname } = useLocation();

  // On login/register we render ONLY the children (no header/sidebar)
  const AUTH_ROUTES = ["/login", "/register"];
  if (AUTH_ROUTES.includes(pathname)) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto w-full max-w-7xl p-4">{children}</div>
      </main>
    );
  }

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  const NavItem = ({ to, children, end = false }: any) => (
    <NavLink
      to={to}
      end={end}
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
    <>
      {/* Top bar */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button className="rounded-md p-2 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(v => !v)}>
            <Bars3Icon className="h-5 w-5" />
          </button>
          <Link to="/" className="text-lg font-semibold text-indigo-700">DocSearchEngine</Link>
          <nav className="hidden gap-1 lg:flex">
            <NavItem to="/" end>Search</NavItem>
            <NavItem to="/explore">Explore</NavItem>
            <NavItem to="/admin">Admin</NavItem>
          </nav>
          <div className="ml-auto">
            {authed ? (
              <button className="text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-2 text-sm" onClick={logout}>Logout</button>
            ) : (
              <Link className="text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-2 text-sm" to="/login">Login</Link>
            )}
          </div>
        </div>
      </header>

      {/* Shell with sidebar */}
      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="hidden w-64 border-r bg-white lg:block">
          <div className="p-4">
            <Link to="/admin" className="text-sm font-semibold text-indigo-700">Admin</Link>
          </div>
          <nav className="px-2">
            {items.map(it => (
              <NavItem key={it.to} to={it.to} end={it.end}>{it.label}</NavItem>
            ))}
          </nav>
        </aside>
        <main className="mx-auto w-full max-w-7xl p-4">
          {children}
        </main>
      </div>
    </>
  );
}
