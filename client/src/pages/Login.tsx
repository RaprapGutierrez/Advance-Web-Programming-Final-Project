import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, type Role } from "../lib/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Real product features (no invented statistics).
const perks = [
  "Pick a room, date and time slot in seconds.",
  "See peak and off-peak rates up front.",
  "Track bookings, payments and receipts.",
];

// Dark-friendly input + field styles shared across the auth screens.
const inputCls =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 transition focus:border-brand-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-white/80">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm font-medium text-rose-300">{error}</p>
      )}
    </div>
  );
}

export default function Login() {
  const { loginAs } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const em = email.trim().toLowerCase();
    if (!em || !password) return setError("Enter your email and password.");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Wrong email or password.");
        return;
      }

      const role = data.user.role as Role;
      loginAs(role, { id: data.user.id, name: data.user.name });
      navigate(from ?? (role === "owner" ? "/dashboard" : "/studios"), {
        replace: true,
      });
    } catch {
      setError("Cannot reach the server. Is it running on port 5000?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-brand-900 text-white shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-spot-400/20 blur-3xl"
        />

        <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:gap-12">
          {/* Brand / perks side */}
          <aside className="hidden flex-col justify-between lg:flex">
            <div>
              <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/10">
                <span className="h-4 w-4 rounded-full bg-spot-400 shadow-[0_0_14px_4px_rgb(255_176_46/0.55)]" />
              </span>
              <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight">
                Welcome back to StudioSpace.
              </h2>
              <p className="mt-3 max-w-sm text-white/60">
                Log in to manage your bookings, rooms and payments.
              </p>
              <ul className="mt-8 space-y-3">
                {perks.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-3 text-sm text-white/85"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ok-600 text-xs font-bold text-white">
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-10 border-t border-white/10 pt-6 text-sm text-white/50">
              New customer?{" "}
              <Link
                to="/register"
                className="font-bold text-spot-300 underline"
              >
                Create an account
              </Link>
            </p>
          </aside>

          {/* Form side */}
          <section className="mx-auto w-full max-w-md lg:self-center">
            <header className="mb-6">
              <h1 className="text-2xl font-extrabold sm:text-3xl">
                Welcome to StudioSpace
              </h1>
              <p className="mt-1 text-white/60">Log in with your account.</p>
            </header>

            <form onSubmit={submit} className="space-y-4" noValidate>
              <AuthField label="Email">
                <input
                  type="email"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </AuthField>

              <AuthField label="Password">
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    className={`${inputCls} pr-16`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto px-2 text-xs font-semibold text-spot-300 hover:text-spot-400"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </AuthField>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-alert-600/40 bg-alert-600/15 px-3 py-2 text-sm font-medium text-rose-200"
                >
                  {error}
                </p>
              )}

              <button className="btn btn-spot w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-5 text-sm text-white/60 lg:hidden">
              New customer?{" "}
              <Link
                to="/register"
                className="font-bold text-spot-300 underline"
              >
                Create an account
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
