// src/components/Tasks.jsx
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Tasks({ user, setUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/tasks`)
      .then(r => r.json())
      .then(data => {
        setTasks(data);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const completeTask = async (taskId) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data && data.points !== undefined) {
        const updatedUser = { ...user, points: data.points, completedTasks: data.completedTasks };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="tasks-container">
      <h2>Tasks</h2>
      <div className="tasks-grid">
        {tasks.map(task => {
          const done = user?.completedTasks?.includes(task.id);
          return (
            <div key={task.id} className="task-card">
              <div className="task-icon">{task.icon || "🔹"}</div>
              <div className="task-body">
                <h3>{task.title}</h3>
                <p>Points: {task.points}</p>
                <div className="task-actions">
                  <button
                    onClick={() => completeTask(task.id)}
                    disabled={done}
                  >
                    {done ? "Completed" : "Complete"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
