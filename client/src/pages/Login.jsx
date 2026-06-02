// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import "./auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm]         = useState({ email: "", password: "" });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    setApiError("");
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim())                    errs.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email    = "Enter a valid email";
    if (!form.password)                        errs.password = "Password is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError("");

    try {
      const { data } = await loginUser(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Left decorative panel ─────────────────────────────── */}
      <div className="auth-deco">
        <div className="auth-deco-orb1" />
        <div className="auth-deco-orb2" />

        <div className="auth-deco-content">
          <div className="auth-deco-icon">✦</div>

          <h2 className="auth-deco-title">
            Your second brain,
            <span className="gradient-text">now with AI</span>
          </h2>
          <p className="auth-deco-sub">
            Capture ideas, organise thoughts, and ask AI questions
            about anything you've written.
          </p>

          <div className="auth-deco-pills">
            <div className="auth-deco-pill">
              <span className="pill-dot gold" />
              AI Q&A on every note
            </div>
            <div className="auth-deco-pill">
              <span className="pill-dot indigo" />
              End-to-end secure with JWT
            </div>
            <div className="auth-deco-pill">
              <span className="pill-dot violet" />
              Instant Ctrl+S auto-save
            </div>
          </div>
        </div>
      </div>

      {/* ── Form panel ────────────────────────────────────────── */}
      <div className="auth-form-panel">
        <div className="auth-card">

          {/* Brand */}
          <div className="auth-brand">
            <div className="auth-brand-gem">✦</div>
            <span className="auth-brand-name">AI Notes</span>
            <Link to="/" className="auth-back-link">← Home</Link>
          </div>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue to your workspace</p>

          {/* Error */}
          {apiError && (
            <div className="auth-error" role="alert">
              <span>⚠</span> {apiError}
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className={`form-input ${errors.email ? "error" : ""}`}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
              {errors.email && <span className="field-error">⚠ {errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className={`form-input ${errors.password ? "error" : ""}`}
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              {errors.password && <span className="field-error">⚠ {errors.password}</span>}
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" />Signing in…</> : "Sign In →"}
            </button>
          </form>

          <div className="auth-divider">or</div>
          <p className="auth-footer">
            Don't have an account?{" "}
            <Link className="auth-link" to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
