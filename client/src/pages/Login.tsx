// src/pages/Login.tsx
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Field } from "../components/ui";
import { useAuth, type Role } from "../lib/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
  const { loginAs } = useAuth();
const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div style={{ maxWidth: 480, margin: "10vh auto", padding: 24 }}>
      <h1 style={{ marginBottom: 4 }}>Welcome to StudioSpace</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>Log in with your account.</p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Email" error={undefined}>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Password" error={undefined}>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm font-medium text-alert-600">
            {error}
          </p>
        )}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="text-sm">
          New customer?{" "}
          <Link to="/register" className="font-bold underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
