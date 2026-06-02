// src/pages/Home.jsx
// Landing Page — Modern Classic 3D Design

import { Link } from "react-router-dom";
import "./home.css";

const features = [
  {
    icon: "✦",
    iconClass: "gold-icon",
    glowColor: "rgba(240,180,41,0.2)",
    title: "Smart Note Organisation",
    desc: "Create, edit and organise your notes with a fluid split-panel interface. Every note is automatically saved and synced.",
  },
  {
    icon: "◈",
    iconClass: "indigo-icon",
    glowColor: "rgba(99,102,241,0.2)",
    title: "AI-Powered Q&A",
    desc: "Ask Gemini AI anything about your notes. Get instant, context-aware answers drawn directly from your content.",
  },
  {
    icon: "⬡",
    iconClass: "violet-icon",
    glowColor: "rgba(139,92,246,0.2)",
    title: "Secure by Design",
    desc: "Every note is owned by you alone. JWT authentication and per-note ownership checks ensure complete privacy.",
  },
  {
    icon: "⚡",
    iconClass: "emerald-icon",
    glowColor: "rgba(16,185,129,0.2)",
    title: "Lightning Fast",
    desc: "Built on Vite + React Query — instant UI updates, optimistic mutations, and intelligent background caching.",
  },
  {
    icon: "✎",
    iconClass: "rose-icon",
    glowColor: "rgba(244,63,94,0.2)",
    title: "Rich Editing Experience",
    desc: "Inline editing with Ctrl+S shortcut, unsaved-change detection, and a double-confirm delete guard.",
  },
  {
    icon: "◉",
    iconClass: "cyan-icon",
    glowColor: "rgba(6,182,212,0.2)",
    title: "RESTful & Scalable",
    desc: "A clean Express + Prisma backend with Zod validation, proper error codes, and PostgreSQL cascade deletes.",
  },
];

const steps = [
  {
    n: "I",
    title: "Create an Account",
    desc: "Register in seconds — just your name, email and a password. We'll sign you in automatically.",
  },
  {
    n: "II",
    title: "Write Your Notes",
    desc: "Use the sidebar to create notes. Click any note to open it in the full editor panel.",
  },
  {
    n: "III",
    title: "Ask Your AI",
    desc: "With a note open, type any question into the AI panel. Gemini will answer using your note's content.",
  },
];

export default function Home() {
  return (
    <div className="home-page">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="home-nav">
        <div className="nav-brand">
          <div className="nav-brand-gem">✦</div>
          <span>AI Notes</span>
        </div>

        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how" className="nav-link">How it works</a>
        </div>

        <div className="nav-cta">
          <Link to="/login" className="btn-nav-login">Sign In</Link>
          <Link to="/register" className="btn-nav-primary">Get Started Free</Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-grid" aria-hidden="true" />

        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" />
          Powered by Google Gemini AI
        </div>

        <h1 className="hero-headline">
          Notes that think
          <span className="gradient-text">alongside you</span>
        </h1>

        <p className="hero-sub">
          Write, organise, and ask AI questions about your notes — all in one
          beautifully designed workspace built for modern knowledge work.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="btn-primary-hero">
            <span>Start for free</span>
            <span>→</span>
          </Link>
          <Link to="/login" className="btn-secondary-hero">
            Sign in to your workspace
          </Link>
        </div>

        {/* 3D floating note cards */}
        <div className="hero-cards-scene" aria-hidden="true">
          {/* Left card */}
          <div className="floating-card card-left">
            <div className="card-tag violet">✎ Design</div>
            <div className="card-title">UI Principles</div>
            <div className="card-preview">
              Good design is invisible. It solves the problem without drawing
              attention to itself…
            </div>
          </div>

          {/* Main card */}
          <div className="floating-card card-main">
            <div className="card-tag indigo">◈ AI Enhanced</div>
            <div className="card-title">Q3 Strategy & Goals</div>
            <div className="card-preview">
              Focus areas: improve user retention by 30%, launch mobile app
              beta, expand the API to third-party integrations…
            </div>
            <div className="card-ai-badge">
              <span className="card-ai-icon">✦</span>
              <div className="card-ai-text">
                AI: "Your top priority should be retention since it directly impacts MRR."
              </div>
            </div>
          </div>

          {/* Right card */}
          <div className="floating-card card-right">
            <div className="card-tag gold">✦ Idea</div>
            <div className="card-title">Book Summary</div>
            <div className="card-preview">
              Atomic Habits — tiny 1% improvements compound into remarkable
              results over time…
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="hero-stats">
        <div className="stat-item">
          <div className="stat-value">100%</div>
          <div className="stat-label">Private & Secure</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-value">∞</div>
          <div className="stat-label">Notes</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-value">AI</div>
          <div className="stat-label">Gemini Powered</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-value">0</div>
          <div className="stat-label">Cost to start</div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="features-section" id="features">
        <div className="section-header">
          <div className="section-eyebrow">Everything you need</div>
          <h2 className="section-title">
            Built for serious knowledge work
          </h2>
          <p className="section-subtitle">
            From fast note capture to deep AI conversations — every feature
            is designed to amplify your thinking.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div
                className="feature-card-glow"
                style={{ background: f.glowColor }}
              />
              <div className={`feature-icon-wrap ${f.iconClass}`}>
                {f.icon}
              </div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="how-section" id="how">
        <div className="how-inner">
          <div className="section-header">
            <div className="section-eyebrow">Simple by design</div>
            <h2 className="section-title">Up and running in minutes</h2>
            <p className="section-subtitle">
              No complex setup. No confusing features. Just open, write, and ask.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map((s) => (
              <div className="step-card" key={s.n}>
                <div className="step-number">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-card">
          <div className="cta-orb cta-orb-1" />
          <div className="cta-orb cta-orb-2" />

          <h2 className="cta-title">
            Ready to think{" "}
            <span className="gradient-text">smarter?</span>
          </h2>
          <p className="cta-sub">
            Join and start your first AI-powered note today.
            No credit card required.
          </p>
          <div className="cta-actions">
            <Link to="/register" className="btn-primary-hero">
              Create your free account →
            </Link>
            <Link to="/login" className="btn-secondary-hero">
              Already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="footer-brand">
          <span>✦</span>
          <span>AI Notes</span>
        </div>
        <p className="footer-copy">© 2026 AI Notes. All rights reserved.</p>
        <div className="footer-links">
          <a href="#features" className="footer-link">Features</a>
          <a href="#how" className="footer-link">How it works</a>
          <Link to="/login" className="footer-link">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
