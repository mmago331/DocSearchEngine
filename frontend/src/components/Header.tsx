import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const authed = !!localStorage.getItem("token");

  const logout = () => { localStorage.removeItem("token"); nav("/login"); };

  const NavItem = ({ to, children }: any) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium ${
          isActive ? "bg-indigo-100 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
        }`
      }
      onClick={() => setOpen(false)}
    >
      {children}
    </NavLink>
  );

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button className="lg:hidden rounded-md p-2 hover:bg-gray-100" onClick={() => setOpen(v => !v)}>
          <Bars3Icon className="h-5 w-5" />
        </button>
        <Link to="/" className="text-lg font-semibold text-indigo-700">DocSearchEngine</Link>
        <nav className="ml-6 hidden gap-1 lg:flex">
          <NavItem to="/">Search</NavItem>
          <NavItem to="/library">Library</NavItem>
          <NavItem to="/explore">Explore</NavItem>
          <NavItem to="/admin">Admin</NavItem>
        </nav>
        <div className="ml-auto">
          {authed ? <button className="btn-ghost" onClick={logout}>Logout</button> : <Link className="btn-ghost" to="/login">Login</Link>}
        </div>
      </div>
      {open && (
        <div className="border-t bg-white px-4 py-2 lg:hidden">
          <div className="flex flex-col gap-1">
            <NavItem to="/">Search</NavItem>
            <NavItem to="/library">Library</NavItem>
            <NavItem to="/explore">Explore</NavItem>
            <NavItem to="/admin">Admin</NavItem>
          </div>
        </div>
      )}
    </header>
  );
}
