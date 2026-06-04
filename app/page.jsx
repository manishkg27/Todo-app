"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState("all");
  const [editingTask, setEditingTask] = useState(null); // replaces taskIdInput
  const [showModal, setShowModal] = useState(false);

  // ---- replaces loadTasks() ----
  const fetchTasks = async () => {
    const res = await fetch("/api/todos");
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
  }, []);

  // ---- replaces form submit ----
  const handleSubmit = async () => {
    if (!title.trim()) return;

    if (editingTask) {
      // Edit existing
      await fetch(`/api/todos/${editingTask._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
    } else {
      // Add new
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
    }

    setTitle("");
    setDescription("");
    setEditingTask(null);
    setShowModal(false);
    fetchTasks();
  };

  // ---- replaces toggleComplete ----
  const toggleComplete = async (task) => {
    await fetch(`/api/todos/${task._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    fetchTasks();
  };

  // ---- replaces delete ----
  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  // ---- replaces renderTasks() filter logic ----
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        currentFilter === "all"
          ? true
          : currentFilter === "completed"
            ? task.completed
            : !task.completed;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => Number(a.completed) - Number(b.completed)); // your sort logic

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setShowModal(true);
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <span>Welcome, {session?.user?.name}</span>
        <button onClick={() => signOut()} className="text-red-500">
          Logout
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-4">My Todos</h1>

      {/* Search */}
      <input
        className="border p-2 w-full mb-4 rounded"
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Filters — your filter buttons */}
      <div className="flex gap-2 mb-4">
        {["all", "uncompleted", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setCurrentFilter(f)}
            className={`px-4 py-1 rounded border ${currentFilter === f ? "bg-black text-white" : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <button
        onClick={() => {
          setEditingTask(null);
          setTitle("");
          setDescription("");
          setShowModal(true);
        }}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        + Add Task
      </button>

      {/* Task Table — your renderTasks() */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Title</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center p-8 text-gray-400">
                No tasks found.
              </td>
            </tr>
          ) : (
            filteredTasks.map((task) => (
              <tr key={task._id} className="border-b">
                <td
                  className={`p-2 ${task.completed ? "line-through text-gray-400" : ""}`}
                >
                  {task.title}
                </td>
                <td
                  className={`p-2 ${task.completed ? "line-through text-gray-400" : ""}`}
                >
                  {task.description}
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => toggleComplete(task)}>
                    {task.completed ? "✅" : "⭕"}
                  </button>
                </td>
                <td className="p-2 flex gap-2 justify-center">
                  <button
                    onClick={() => openEditModal(task)}
                    className="text-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task._id)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal — your taskModal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-xl font-bold mb-4">
              {editingTask ? "Edit Task" : "Add New Task"}
            </h2>
            <input
              className="border p-2 w-full mb-3 rounded"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="border p-2 w-full mb-3 rounded"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {editingTask ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
