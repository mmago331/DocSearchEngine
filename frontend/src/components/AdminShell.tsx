import { Link, NavLink, Outlet } from "react-router-dom";

const items = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/documents", label: "Documents" }
  // add Users, Settings later
];

export default function AdminShell() {
  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <aside className="hidden w-64 border-r bg-white lg:block">
        <div className="p-4">
          <Link to="/" className="text-sm font-semibold text-indigo-700">← Back to app</Link>
        </div>
        <nav className="px-2">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-7xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
