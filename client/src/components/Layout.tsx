import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth, type Role } from "../lib/auth";

const allLinks: { to: string; label: string; roles: Role[] }[] = [
  { to: "/studios", label: "Studios", roles: ["customer", "owner"] },
  { to: "/calendar", label: "Calendar", roles: ["customer", "owner"] },
  { to: "/dashboard", label: "Dashboard", roles: ["owner"] },
  { to: "/renters", label: "Renters", roles: ["owner"] },
  { to: "/payments", label: "Payments", roles: ["owner"] },
  { to: "/reports", label: "Reports", roles: ["owner"] },
];

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-brand-900 text-white" : "text-ink-500 hover:bg-brand-50"}`;

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = allLinks.filter((l) => user && l.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-haze/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-extrabold"
          >
            <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-brand-900">
              <span className="h-3.5 w-3.5 rounded-full bg-spot-400 shadow-[0_0_14px_4px_rgb(255_176_46/0.55)]" />
            </span>
            StudioSpace
          </Link>

          <nav className="hidden gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkCls}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <span className="text-sm text-ink-500">
                  {user.name}{" "}
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold capitalize">
                    {user.role}
                  </span>
                </span>
                <button className="btn btn-ghost px-3" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-ghost px-3">
                Login
              </Link>
            )}
          </div>

          <button
            className="btn btn-ghost px-3 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={linkCls}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <button className="btn btn-ghost mt-2" onClick={handleLogout}>
                Logout ({user.role})
              </button>
            ) : (
              <Link
                to="/login"
                className="btn btn-ghost mt-2"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
            )}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-line py-6 text-center text-sm text-ink-500">
        StudioSpace · Advanced Web Programming final project
      </footer>
    </div>
  );
}
