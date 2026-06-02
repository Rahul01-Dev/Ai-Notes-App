// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import "./auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm]         = useState({ name: "", email: "", password: "" });
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
    if (!form.name.trim())                              errs.name     = "Name is required";
    else if (form.name.trim().length < 2)               errs.name     = "Name must be at least 2 characters";
    if (!form.email.trim())                             errs.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))          errs.email    = "Enter a valid email";
    if (!form.password)                                 errs.password = "Password is required";
    else if (form.password.length < 6)                  errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError("");

    try {
      const { data } = await registerUser(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || "Registration failed. Please try again.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Password strength ──────────────────────────────────────────
  const pwStrength = (() => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 6)           score++;
    if (p.length >= 10)          score++;
    if (/[A-Z]/.test(p))        score++;
    if (/[0-9]/.test(p))        score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: "Weak",   color: "#f87171", width: "25%" };
    if (score <= 3) return { label: "Fair",   color: "#fb923c", width: "60%" };
    return              { label: "Strong", color: "#34d399", width: "100%" };
  })();

  return (
    <div className="auth-page">

      {/* ── Left decorative panel ─────────────────────────────── */}
      <div className="auth-deco">
        <div className="auth-deco-orb1" />
        <div className="auth-deco-orb2" />

        <div className="auth-deco-content">
          <div className="auth-deco-icon">✦</div>

          <h2 className="auth-deco-title">
            Start thinking
            <span className="gradient-text">smarter today</span>
          </h2>
          <p className="auth-deco-sub">
            Create your free account and get AI-powered insights
            from your very first note.
          </p>

          <div className="auth-deco-pills">
            <div className="auth-deco-pill">
              <span className="pill-dot gold" />
              Ask AI anything about your notes
            </div>
            <div className="auth-deco-pill">
              <span className="pill-dot indigo" />
              No credit card required
            </div>
            <div className="auth-deco-pill">
              <span className="pill-dot violet" />
              Your data stays yours, always
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

          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join and start your AI-powered workspace</p>

          {/* Error */}
          {apiError && (
            <div className="auth-error" role="alert">
              <span>⚠</span> {apiError}
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                className={`form-input ${errors.name ? "error" : ""}`}
                type="text"
                name="name"
                placeholder="Rahul Dev"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                autoFocus
              />
              {errors.name && <span className="field-error">⚠ {errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                className={`form-input ${errors.email ? "error" : ""}`}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && <span className="field-error">⚠ {errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                className={`form-input ${errors.password ? "error" : ""}`}
                type="password"
                name="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.password && <span className="field-error">⚠ {errors.password}</span>}

              {/* Strength meter */}
              {pwStrength && !errors.password && (
                <div className="pw-strength">
                  <div className="pw-strength-bar">
                    <div
                      className="pw-strength-fill"
                      style={{ width: pwStrength.width, background: pwStrength.color }}
                    />
                  </div>
                  <span className="pw-strength-label" style={{ color: pwStrength.color }}>
                    {pwStrength.label}
                  </span>
                </div>
              )}
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading
                ? <><span className="spinner" />Creating account…</>
                : "Create Account →"
              }
            </button>
          </form>

          <div className="auth-divider">or</div>
          <p className="auth-footer">
            Already have an account?{" "}
            <Link className="auth-link" to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
