// src/pages/Notes.jsx
// Split-panel Notes dashboard — Modern Classic 3D Design

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotes, createNote, updateNote, deleteNote, askAI } from "../api/notes";
import "./notes.css";

// ── Helpers ──────────────────────────────────────────────────────
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });

// ── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`toast ${type}`}>
      {type === "success" ? "✓" : "⚠"} {message}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
export default function Notes() {
  const navigate = useNavigate();
  const qClient  = useQueryClient();
  const user     = JSON.parse(localStorage.getItem("user") || "{}");

  // ── State ──────────────────────────────────────────────────────
  const [selected, setSelected]           = useState(null);
  const [editTitle, setEditTitle]         = useState("");
  const [editContent, setEditContent]     = useState("");
  const [isDirty, setIsDirty]             = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [toast, setToast]                 = useState(null);
  const [saving, setSaving]               = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // AI state
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiHistory, setAiHistory]   = useState([]);
  const [aiLoading, setAiLoading]   = useState(false);
  const aiBottomRef = useRef(null);

  // Create-form state
  const [newTitle, setNewTitle]     = useState("");
  const [newContent, setNewContent] = useState("");

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  // ── Toast ─────────────────────────────────────────────────────
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // ── Fetch notes ───────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["notes"],
    queryFn: () => getNotes().then((r) => r.data.notes),
  });

  const notes = data ?? [];

  // ── Select a note ─────────────────────────────────────────────
  const selectNote = (note) => {
    setSelected(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsDirty(false);
    setSaved(false);
    setAiQuestion("");
    setAiHistory([]);
  };

  // Sync edit fields when cache refreshes
  useEffect(() => {
    if (selected && notes.length) {
      const fresh = notes.find((n) => n.id === selected.id);
      if (fresh && !isDirty) {
        setEditTitle(fresh.title);
        setEditContent(fresh.content);
        setSelected(fresh);
      }
    }
  }, [notes]); // eslint-disable-line

  // ── Create note ───────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: createNote,
    onSuccess: ({ data: res }) => {
      qClient.invalidateQueries({ queryKey: ["notes"] });
      setNewTitle("");
      setNewContent("");
      selectNote(res.note);
      showToast("Note created!");
    },
    onError: () => showToast("Failed to create note.", "error"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    createMut.mutate({ title: newTitle.trim(), content: newContent.trim() });
  };

  // ── Save (update) note ────────────────────────────────────────
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateNote(id, data),
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ["notes"] });
      setIsDirty(false);
      setSaved(true);
      setSaving(false);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: () => {
      setSaving(false);
      showToast("Failed to save.", "error");
    },
  });

  const handleSave = () => {
    if (!selected || !isDirty) return;
    setSaving(true);
    updateMut.mutate({
      id: selected.id,
      data: { title: editTitle, content: editContent },
    });
  };

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, isDirty, editTitle, editContent]); // eslint-disable-line

  // ── Delete note ───────────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: deleteNote,
    onSuccess: (_, deletedId) => {
      qClient.invalidateQueries({ queryKey: ["notes"] });
      if (selected?.id === deletedId) {
        setSelected(null);
        setEditTitle("");
        setEditContent("");
        setIsDirty(false);
      }
      setDeleteConfirm(null);
      showToast("Note deleted.");
    },
    onError: () => {
      setDeleteConfirm(null);
      showToast("Failed to delete.", "error");
    },
  });

  const handleDelete = (noteId, e) => {
    e?.stopPropagation();
    if (deleteConfirm === noteId) {
      deleteMut.mutate(noteId);
    } else {
      setDeleteConfirm(noteId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  // ── Ask AI ────────────────────────────────────────────────────
  const handleAsk = async (e) => {
    e.preventDefault();
    const q = aiQuestion.trim();
    if (!q || !selected || aiLoading) return;

    setAiLoading(true);
    setAiQuestion("");

    const entry = { id: Date.now(), question: q, answer: null, error: null };
    setAiHistory((prev) => [...prev, entry]);

    setTimeout(() => aiBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const { data } = await askAI(selected.id, q);
      setAiHistory((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, answer: data.answer } : item
        )
      );
    } catch (err) {
      const msg = err.response?.data?.error || "AI request failed. Try again.";
      setAiHistory((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, error: msg } : item
        )
      );
    } finally {
      setAiLoading(false);
      setTimeout(() => aiBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="notes-page">

      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav className="notes-navbar">
        <div className="navbar-brand">
          <div className="navbar-icon">✦</div>
          AI Notes
        </div>
        <div className="navbar-right">
          {user.name && (
            <span className="navbar-user">
              Hey, <strong>{user.name.split(" ")[0]}</strong>
            </span>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      <div className="notes-body">

        {/* ══ LEFT SIDEBAR ═══════════════════════════════════════ */}
        <aside className="notes-sidebar">

          {/* Create form */}
          <form className="create-form" onSubmit={handleCreate}>
            <div className="create-form-header">
              <span className="create-form-header-dot" />
              New Note
            </div>
            <input
              className="create-input"
              type="text"
              placeholder="Title…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={200}
            />
            <textarea
              className="create-input create-textarea"
              placeholder="What's on your mind?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
            />
            <button
              className="create-btn"
              type="submit"
              disabled={!newTitle.trim() || !newContent.trim() || createMut.isPending}
            >
              {createMut.isPending
                ? <><span className="spinner" style={{ width: 12, height: 12 }} />Creating…</>
                : <>＋ Create Note</>
              }
            </button>
          </form>

          {/* Notes list */}
          <div className="notes-list-header">
            <span className="notes-list-label">Notes</span>
            {notes.length > 0 && (
              <span className="notes-count-badge">{notes.length}</span>
            )}
          </div>

          <div className="notes-list">
            {isLoading && (
              <div className="sidebar-loading">
                {[1, 2, 3].map((k) => <div key={k} className="skeleton" />)}
              </div>
            )}

            {isError && (
              <div className="sidebar-empty">
                <div className="sidebar-empty-icon">⚠</div>
                <p className="sidebar-empty-text">
                  Failed to load notes.<br />Check your connection.
                </p>
              </div>
            )}

            {!isLoading && !isError && notes.length === 0 && (
              <div className="sidebar-empty">
                <div className="sidebar-empty-icon">📝</div>
                <p className="sidebar-empty-text">
                  No notes yet.<br />Create your first one above!
                </p>
              </div>
            )}

            {notes.map((note) => (
              <div
                key={note.id}
                className={`note-item ${selected?.id === note.id ? "active" : ""}`}
                onClick={() => selectNote(note)}
              >
                <div className="note-item-body">
                  <div className="note-item-title">{note.title}</div>
                  <div className="note-item-preview">{note.content}</div>
                  <div className="note-item-date">{fmtDate(note.updatedAt)}</div>
                </div>
                <button
                  className="note-delete-btn"
                  title={deleteConfirm === note.id ? "Click again to confirm" : "Delete note"}
                  onClick={(e) => handleDelete(note.id, e)}
                  style={deleteConfirm === note.id
                    ? { opacity: 1, color: "var(--error)", borderColor: "rgba(248,113,113,0.35)" }
                    : undefined
                  }
                >
                  {deleteConfirm === note.id ? "!" : "✕"}
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* ══ RIGHT DETAIL PANEL ══════════════════════════════════ */}
        <section className="notes-detail">
          {!selected ? (

            <div className="detail-empty">
              <div className="detail-empty-icon">✦</div>
              <div className="detail-empty-title">Select a note to read</div>
              <p className="detail-empty-sub">
                Pick a note from the list on the left, or create a new one
                to get started with AI-powered notes.
              </p>
            </div>

          ) : (
            <>
              {/* Header */}
              <div className="detail-header">
                <div className="detail-meta">
                  <div className="detail-dates">
                    <div className="detail-date-item">
                      Created&nbsp;<span>{fmtDate(selected.createdAt)}</span>
                    </div>
                    <div className="detail-date-item">
                      Updated&nbsp;<span>{fmtDate(selected.updatedAt)} · {fmtTime(selected.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="detail-actions">
                    <button
                      className="detail-delete-btn"
                      onClick={() => handleDelete(selected.id)}
                      title="Delete this note"
                    >
                      {deleteConfirm === selected.id ? "⚠ Confirm?" : "✕ Delete"}
                    </button>
                  </div>
                </div>

                {/* Editable title */}
                <input
                  className="detail-title-input"
                  type="text"
                  value={editTitle}
                  onChange={(e) => {
                    setEditTitle(e.target.value);
                    setIsDirty(true);
                    setSaved(false);
                  }}
                  placeholder="Note title…"
                  maxLength={200}
                />
              </div>

              {/* Editable content */}
              <div className="detail-content-wrap">
                <textarea
                  className="detail-content-input"
                  value={editContent}
                  onChange={(e) => {
                    setEditContent(e.target.value);
                    setIsDirty(true);
                    setSaved(false);
                  }}
                  placeholder="Start writing your note…"
                />
              </div>

              {/* Save bar */}
              <div className="detail-save-bar">
                <span className={`save-hint ${isDirty ? "dirty" : ""}`}>
                  {isDirty ? "Unsaved changes — Ctrl+S or Save" : ""}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {saved && <span className="saved-indicator">✓ Saved</span>}
                  <button
                    className="save-btn"
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              {/* ══ AI CHAT ══════════════════════════════════════ */}
              <div className="ai-panel">
                <div className="ai-panel-header">
                  <div className="ai-panel-title">
                    <span className="ai-panel-icon">✦</span>
                    Ask AI about this note
                  </div>
                  {aiHistory.length > 0 && (
                    <button
                      className="ai-clear-btn"
                      onClick={() => setAiHistory([])}
                      title="Clear conversation"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Conversation */}
                {aiHistory.length > 0 && (
                  <div className="ai-history">
                    {aiHistory.map((item) => (
                      <div key={item.id} className="ai-exchange">

                        {/* User question */}
                        <div className="ai-bubble ai-bubble-user">
                          <span className="ai-bubble-label">You</span>
                          <p>{item.question}</p>
                        </div>

                        {/* AI answer */}
                        {item.answer === null && !item.error ? (
                          <div className="ai-bubble ai-bubble-ai ai-bubble-loading">
                            <span className="ai-bubble-label">AI</span>
                            <div className="ai-thinking">
                              <span className="ai-dot" />
                              <span className="ai-dot" />
                              <span className="ai-dot" />
                            </div>
                          </div>
                        ) : item.error ? (
                          <div className="ai-bubble ai-bubble-ai ai-bubble-error">
                            <span className="ai-bubble-label">AI</span>
                            <p>⚠ {item.error}</p>
                          </div>
                        ) : (
                          <div className="ai-bubble ai-bubble-ai">
                            <span className="ai-bubble-label">AI</span>
                            <p>{item.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={aiBottomRef} />
                  </div>
                )}

                {/* Input */}
                <form className="ai-input-row" onSubmit={handleAsk}>
                  <input
                    className="ai-input"
                    type="text"
                    placeholder="Ask anything about this note…"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    disabled={aiLoading}
                    maxLength={1000}
                  />
                  <button
                    className="ai-ask-btn"
                    type="submit"
                    disabled={!aiQuestion.trim() || aiLoading}
                  >
                    {aiLoading
                      ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      : "Ask →"
                    }
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Toast ───────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
