import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

function errMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e?.response?.data?.message || e?.message || "Something went wrong.";
}

// Strong-password rules, checked live as the user types.
const pwRules: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "A lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
  { label: "An uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "A number (0–9)", test: (p) => /\d/.test(p) },
  { label: "A symbol (! @ # $ …)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// Index 0-5 maps to how many rules have passed.
const strengthMeta = [
  { label: "Too weak", tone: "bg-alert-600", text: "text-rose-300" },
  { label: "Too weak", tone: "bg-alert-600", text: "text-rose-300" },
  { label: "Fair", tone: "bg-spot-400", text: "text-spot-300" },
  { label: "Good", tone: "bg-spot-400", text: "text-spot-300" },
  { label: "Strong", tone: "bg-ok-600", text: "text-ok-100" },
  { label: "Very strong", tone: "bg-ok-600", text: "text-ok-100" },
];

// Real product features (no invented statistics).
const perks = [
  "Compare rooms, rates and add-ons in one place.",
  "Live availability — no more double-bookings.",
  "Track deposits, balances and receipts.",
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

export default function Register() {
  const { loginAs } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  // Live password feedback: which rules pass, plus a label/tone for the meter.
  const passed = pwRules.map((r) => r.test(f.password));
  const score = passed.filter(Boolean).length;
  const strength = strengthMeta[score];
  const phoneDigits = f.phone.replace(/\D/g, "");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a valid email.";
    if (phoneDigits.length !== 11)
      er.phone = "Phone number must be exactly 11 digits.";
    if (score < pwRules.length)
      er.password = "Your password doesn't meet all the requirements below.";
    if (f.confirm !== f.password) er.confirm = "Passwords do not match.";
    setErrors(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    let user = { id: "", name: f.name.trim() };
    try {
      const res = await api.post("/auth/register", {
        name: f.name.trim(),
        email: f.email.trim().toLowerCase(),
        phone: phoneDigits,
        password: f.password,
      });
      user = res.data.user;
    } catch (err) {
      const message = errMessage(err);
      setErrors(
        /already registered/i.test(message)
          ? { email: "This email is already registered." }
          : { form: message },
      );
      setLoading(false);
      return;
    }

    loginAs("customer", { id: user.id, name: user.name });
    navigate("/studios", { replace: true });
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
                Book studio time without the back-and-forth.
              </h2>
              <p className="mt-3 max-w-sm text-white/60">
                Create a free account and start reserving rooms in under a
                minute.
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
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-spot-300 underline">
                Log in
              </Link>
            </p>
          </aside>

          {/* Form side */}
          <section className="mx-auto w-full max-w-md">
            <header className="mb-6">
              <h1 className="text-2xl font-extrabold sm:text-3xl">
                Create your account
              </h1>
              <p className="mt-1 text-white/60">
                Register to browse studios and book time slots.
              </p>
            </header>

            <form onSubmit={submit} className="space-y-4" noValidate>
              <AuthField label="Full name" error={errors.name}>
                <input
                  className={inputCls}
                  value={f.name}
                  onChange={set("name")}
                  autoComplete="name"
                  placeholder="Juan Dela Cruz"
                />
              </AuthField>

              <AuthField label="Email" error={errors.email}>
                <input
                  type="email"
                  className={inputCls}
                  value={f.email}
                  onChange={set("email")}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </AuthField>

              <AuthField label="Phone (11 digits)" error={errors.phone}>
                <input
                  type="tel"
                  className={inputCls}
                  value={f.phone}
                  onChange={set("phone")}
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="09171234567"
                />
              </AuthField>

              <AuthField label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    className={`${inputCls} pr-16`}
                    value={f.password}
                    onChange={set("password")}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
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

              {/* Strength meter + live rule checklist */}
              {f.password.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/60">
                      Password strength
                    </span>
                    <span className={`text-xs font-bold ${strength.text}`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1.5" aria-hidden>
                    {pwRules.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i < score ? strength.tone : "bg-white/15"
                        }`}
                      />
                    ))}
                  </div>
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {pwRules.map((r, i) => (
                      <li
                        key={r.label}
                        className={`flex items-center gap-1.5 text-xs ${
                          passed[i] ? "text-ok-100" : "text-white/50"
                        }`}
                      >
                        <span className="font-bold">
                          {passed[i] ? "✓" : "○"}
                        </span>
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <AuthField label="Confirm password" error={errors.confirm}>
                <input
                  type="password"
                  className={inputCls}
                  value={f.confirm}
                  onChange={set("confirm")}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                />
              </AuthField>

              {errors.form && (
                <p
                  role="alert"
                  className="rounded-lg border border-alert-600/40 bg-alert-600/15 px-3 py-2 text-sm font-medium text-rose-200"
                >
                  {errors.form}
                </p>
              )}

              <button
                className="btn btn-spot w-full"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>

            <p className="mt-5 text-sm text-white/60 lg:hidden">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-spot-300 underline">
                Log in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}