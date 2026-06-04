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
      {/* Nav */}
      <header className="nav">
        <span className="nav-logo"></span>
        <div style={{ flex: 1 }} />
        <div className="nav-right">
          <span className="nav-user">
            {session?.user?.name && <>Hi, <strong>{session.user.name}</strong></>}
          </span>
          <button className="btn btn-ghost" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </header>

      {/* Page */}
      <div className="page">

        

        {/* Toolbar: search + add task on same row */}
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">
              <svg suppressHydrationWarning width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="btn btn-primary"
            style={{ marginLeft: "auto", flexShrink: 0 }}
            onClick={() => { setEditingTask(null); setTitle(""); setDescription(""); setShowModal(true); }}
          >
            <svg suppressHydrationWarning width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add task
          </button>
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {[
            { key: "all", label: "All" },
            { key: "uncompleted", label: "Active" },
            { key: "completed", label: "Done" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`filter-tab${currentFilter === key ? " active" : ""}`}
              onClick={() => setCurrentFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card">
          <table className="task-table">
            <thead>
              <tr>
                <th style={{ width: "44%" }}>Task</th>
                <th style={{ width: "28%" }}>Note</th>
                <th className="center" style={{ width: "10%" }}>
                  Done
                </th>
                <th className="center" style={{ width: "18%" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">
                      <svg
                        suppressHydrationWarning
                        width="36"
                        height="36"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ margin: "0 auto", color: "#d1d5db" }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="empty-state-title">No tasks</p>
                      <p className="empty-state-sub">
                        {searchQuery
                          ? "No results for your search"
                          : "Add a task to get started"}
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
                    className={`task-row${dragOverId === task._id ? " drag-over" : ""}${task.completed ? " done-row" : ""}`}
                  >
                    {/* Title */}
                    <td>
                      <div className="cell-title">
                        <span className="drag-handle" title="Drag to reorder">
                          ⠿
                        </span>
                        <span
                          className={`task-title${task.completed ? " done" : ""}`}
                        >
                          {task.title}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td>
                      {task.description ? (
                        <span
                          className={`task-desc${task.completed ? " done" : ""}`}
                        >
                          {task.description}
                        </span>
                      ) : (
                        <span className="task-desc-empty">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="center">
                      <button
                        className={`status-btn${task.completed ? " checked" : ""}`}
                        onClick={() => toggleComplete(task)}
                        title={
                          task.completed ? "Mark incomplete" : "Mark complete"
                        }
                      >
                        {task.completed && (
                          <svg
                            suppressHydrationWarning
                            width="11"
                            height="11"
                            fill="none"
                            stroke="white"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="center">
                      <div className="actions-group">
                        <button
                          className="btn-icon"
                          onClick={() => moveUp(task)}
                          title="Move up"
                        >
                          <svg
                            suppressHydrationWarning
                            width="11"
                            height="11"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => moveDown(task)}
                          title="Move down"
                        >
                          <svg
                            suppressHydrationWarning
                            width="11"
                            height="11"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                          onClick={() => openEditModal(task)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                          onClick={() => deleteTask(task._id)}
                        >
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

      {/* Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTask ? "Edit task" : "New task"}
              </h2>
              <button
                className="btn-icon"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <svg
                  suppressHydrationWarning
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="field">
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
              <div className="field">
                <label className="field-label">
                  Note <span>(optional)</span>
                </label>
                <textarea
                  className="field-textarea"
                  placeholder="Any details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
