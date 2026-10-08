import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Field } from "../components/ui";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

function errMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e?.response?.data?.message || e?.message || "Something went wrong.";
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
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a valid email.";
    if (f.phone.trim().length < 7) er.phone = "Enter your phone number.";
    if (f.password.length < 8) er.password = "Use at least 8 characters.";
    if (f.confirm !== f.password) er.confirm = "Passwords do not match.";
    setErrors(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    let user = { id: "", name: f.name.trim() };
    try {
      const res = await api.post("/auth/register", {
        name: f.name.trim(),
        email: f.email.trim().toLowerCase(),
        phone: f.phone.trim(),
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
    <div style={{ maxWidth: 480, margin: "6vh auto", padding: 24 }}>
      <h1 style={{ marginBottom: 4 }}>Create your account</h1>
      <p style={{ opacity: 0.7, marginTop: 0 }}>
        Register to browse studios and book time slots.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Full name" error={errors.name}>
          <input
            className="input"
            value={f.name}
            onChange={set("name")}
            autoComplete="name"
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            className="input"
            value={f.email}
            onChange={set("email")}
            autoComplete="email"
          />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input
            type="tel"
            className="input"
            value={f.phone}
            onChange={set("phone")}
            autoComplete="tel"
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            type="password"
            className="input"
            value={f.password}
            onChange={set("password")}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <input
            type="password"
            className="input"
            value={f.confirm}
            onChange={set("confirm")}
            autoComplete="new-password"
          />
        </Field>
        {errors.form && (
          <p role="alert" className="text-sm font-medium text-alert-600">
            {errors.form}
          </p>
        )}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
        <p className="text-sm">
          Already have an account?{" "}
          <Link to="/login" className="font-bold underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
