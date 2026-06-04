"use client";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [tasks, setTasks]           = useState([]);
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState("all");
  const [editingTask, setEditingTask] = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [dragOverId, setDragOverId] = useState(null);

  const draggedId = useRef(null);

  /* ── Data ──────────────────────────────────────────── */
  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/todos");
      if (res.ok) setTasks(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTasks(); }, []);

  /* ── CRUD ───────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      if (editingTask) {
        await fetch(`/api/todos/${editingTask._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
      } else {
        await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
      }
      setTitle(""); setDescription(""); setEditingTask(null); setShowModal(false);
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const toggleComplete = async (task) => {
    try {
      await fetch(`/api/todos/${task._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setShowModal(true);
  };

  /* ── Filter + Sort ──────────────────────────────────── */
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        currentFilter === "all"       ? true
        : currentFilter === "completed" ? task.completed
        : !task.completed;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
      return (a.order || 0) - (b.order || 0);
    });

  /* ── Move Up / Down ─────────────────────────────────── */
  const moveUp = async (task) => {
    const sorted = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((t) => t._id === task._id);
    let target = -1;
    for (let i = idx - 1; i >= 0; i--) {
      if (sorted[i].completed === task.completed) { target = i; break; }
    }
    if (target === -1) return;
    const prev = sorted[target];
    await Promise.all([
      fetch(`/api/todos/${task._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: prev.order || 0 }) }),
      fetch(`/api/todos/${prev._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: task.order || 0 }) }),
    ]);
    fetchTasks();
  };

  const moveDown = async (task) => {
    const sorted = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((t) => t._id === task._id);
    let target = -1;
    for (let i = idx + 1; i < sorted.length; i++) {
      if (sorted[i].completed === task.completed) { target = i; break; }
    }
    if (target === -1) return;
    const next = sorted[target];
    await Promise.all([
      fetch(`/api/todos/${task._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: next.order || 0 }) }),
      fetch(`/api/todos/${next._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: task.order || 0 }) }),
    ]);
    fetchTasks();
  };

  /* ── Drag & Drop ────────────────────────────────────── */
  const handleDragStart = (e, id) => { draggedId.current = id; e.dataTransfer.effectAllowed = "move"; };
  const handleDragEnd   = ()      => { draggedId.current = null; setDragOverId(null); };
  const handleDragOver  = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== draggedId.current) setDragOverId(id);
  };
  const handleDragLeave = () => setDragOverId(null);

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    setDragOverId(null);
    const fromId = draggedId.current;
    if (!fromId || fromId === targetId) return;
    const list = [...filteredTasks];
    const fromIdx = list.findIndex((t) => t._id === fromId);
    const toIdx   = list.findIndex((t) => t._id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [dragged] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, dragged);
    const updates = list.map((t, i) => ({ _id: t._id, order: i }));
    setTasks((prev) => {
      const map = Object.fromEntries(updates.map((u) => [u._id, u.order]));
      return prev.map((t) => map[t._id] !== undefined ? { ...t, order: map[t._id] } : t);
    });
    await Promise.all(
      updates.map(({ _id, order }) =>
        fetch(`/api/todos/${_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        })
      )
    );
  };

  const remaining = tasks.filter(t => !t.completed).length;

  /* ── Render ─────────────────────────────────────────── */
  return (
    <>
      {/* ── Sticky top auth bar ──────────────────────── */}
      <header className="auth-bar">
        <div className="user-badge">
          <span className="pulse-dot" />
          <span><strong>{session?.user?.name || "User"}</strong></span>
        </div>
        <button className="sign-out-btn" onClick={() => signOut()}>
          <svg suppressHydrationWarning width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </header>

      {/* ── Page body ────────────────────────────────── */}
      <div className="page-content">
        <div className="app-card animate-in">

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">
                <svg suppressHydrationWarning width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                className="search-input"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="btn-primary"
              onClick={() => { setEditingTask(null); setTitle(""); setDescription(""); setShowModal(true); }}
            >
              <svg suppressHydrationWarning width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Add New Task
            </button>
          </div>

          {/* Filter tabs */}
          <div className="filter-bar">
            {[
              { key: "all",         label: "All" },
              { key: "uncompleted", label: "Uncompleted" },
              { key: "completed",   label: "Completed" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`filter-tab${currentFilter === key ? " filter-tab--active" : ""}`}
                onClick={() => setCurrentFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Table */}
          <table className="task-table">
            <thead>
              <tr>
                <th style={{ width: "45%" }}>Title</th>
                <th style={{ width: "22%" }}>Description</th>
                <th className="col-center" style={{ width: "10%" }}>Status</th>
                <th className="col-center" style={{ width: "23%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">
                      <svg suppressHydrationWarning width="42" height="42" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#c8d0de" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="empty-state-title">No tasks here</p>
                      <p className="empty-state-sub">
                        {searchQuery ? "Try a different search term" : "Click \"+ Add New Task\" to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, task._id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, task._id)}
                    className={`task-row${dragOverId === task._id ? " drag-over" : ""}${task.completed ? " completed-row" : ""}`}
                  >
                    {/* Title */}
                    <td>
                      <div className="cell-title">
                        <span className="drag-handle" title="Drag to reorder">⠿</span>
                        <span className={`task-title-text${task.completed ? " done" : ""}`}>
                          {task.title}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td>
                      {task.description
                        ? <span className={`task-desc-text${task.completed ? " done" : ""}`}>{task.description}</span>
                        : <span className="task-desc-empty">—</span>
                      }
                    </td>

                    {/* Status */}
                    <td className="col-center">
                      <button
                        className="status-btn"
                        onClick={() => toggleComplete(task)}
                        title={task.completed ? "Mark incomplete" : "Mark complete"}
                      >
                        {task.completed ? (
                          <svg suppressHydrationWarning width="22" height="22" fill="currentColor" viewBox="0 0 20 20" style={{ color: "#10b981" }}>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg suppressHydrationWarning width="22" height="22" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="1.75" />
                          </svg>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="col-center">
                      <div className="actions-group">
                        <button className="action-icon-btn" onClick={() => moveUp(task)} title="Move up">
                          <svg suppressHydrationWarning width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button className="action-icon-btn" onClick={() => moveDown(task)} title="Move down">
                          <svg suppressHydrationWarning width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button className="action-text-btn edit" onClick={() => openEditModal(task)}>
                          <svg suppressHydrationWarning width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button className="action-text-btn delete" onClick={() => deleteTask(task._id)}>
                          <svg suppressHydrationWarning width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          
        </div>
      </div>

      {/* ── Modal ────────────────────────────────────── */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="modal-dialog">
            <h2 className="modal-title">
              {editingTask ? "Edit Task" : "Add New Task"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Title</label>
                <input
                  className="field-input"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="field-group">
                <label className="field-label">
                  Description{" "}
                  <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.65, letterSpacing: 0 }}>(optional)</span>
                </label>
                <textarea
                  className="field-textarea"
                  placeholder="Add any notes or details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
