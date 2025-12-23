import { useState, useEffect } from "react";
import "./TasksPage.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      } else {
        setTasks([
          { id: 1, type: "youtube", title: "Subscribe to SABA Channel", points: 50, completed: false, icon: "▶️", url: "https://youtube.com" },
          { id: 2, type: "telegram", title: "Join Official Telegram", points: 30, completed: true, icon: "✈️", url: "https://t.me" },
          { id: 3, type: "facebook", title: "Follow on Facebook", points: 40, completed: false, icon: "👍", url: "https://facebook.com" },
          { id: 4, type: "tiktok", title: "Follow on TikTok", points: 40, completed: false, icon: "🎵", url: "https://tiktok.com" },
          { id: 5, type: "invite", title: "Invite 3 Friends", points: 100, completed: false, icon: "👥", url: null },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const handleCompleteTask = async (task) => {
    if (task.url) {
      window.open(task.url, "_blank");
    }

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchTasks();
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const filteredTasks =
    activeTab === "all" ? tasks : tasks.filter((t) => t.type === activeTab);

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h1 className="tasks-title">Social Tasks</h1>
        <p className="tasks-subtitle">
          Complete tasks to earn points and unlock levels
        </p>
      </div>

      <div className="tasks-tabs">
        {["all", "youtube", "telegram", "facebook", "tiktok", "invite"].map(
          (tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </div>

      <div className="tasks-grid">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`task-card ${task.completed ? "completed" : ""}`}
          >
            <span className="task-icon">{task.icon}</span>

            <div className="task-content">
              <h3 className="task-title">{task.title}</h3>
              <p className="task-points">+{task.points} Points</p>
            </div>

            <button
              className={`btn ${
                task.completed ? "btn-secondary" : "btn-primary"
              }`}
              onClick={() => !task.completed && handleCompleteTask(task)}
              disabled={task.completed}
            >
              {task.completed ? "✓ Completed" : "Complete"}
            </button>
          </div>
        ))}
      </div>

      <div className="tasks-info">
        <h3>How Tasks Work</h3>
        <p>
          Complete social actions to earn points. Some tasks are verified
          automatically via API, while others require manual proof submission.
        </p>
      </div>
    </div>
  );
}
