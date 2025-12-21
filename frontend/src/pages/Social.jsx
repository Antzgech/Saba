import React, { useEffect, useState } from 'react';
import { tasksAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Social = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await tasksAPI.getTasks();
        setTasks(res.data.data || []);
      } catch (err) {
        console.error("Failed to load tasks:", err);
      }
    };

    loadTasks();
  }, []);

  const completeTask = async (taskId) => {
    try {
      await tasksAPI.completeTask(taskId);
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, status: "completed" } : t
        )
      );
    } catch (err) {
      console.error("Failed to complete task:", err);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-b from-[#0A1A2F] to-[#0D0D0D] text-white">

      {/* Header */}
      <h1 className="text-3xl font-semibold text-gold-400 mb-2">
        Quest Board
      </h1>
      <p className="text-gray-300 mb-6">
        Complete tasks to earn the Queen’s favor.
      </p>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 && (
          <div className="text-gray-400">Loading tasks...</div>
        )}

        {tasks.map(task => (
          <div
            key={task.id}
            className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-semibold text-gold-400">
                  {task.title}
                </div>
                <div className="text-gray-300 text-sm mt-1">
                  {task.description}
                </div>
                <div className="text-gold-400 text-sm mt-2">
                  +{task.rewardPoints} points
                </div>
              </div>

              <div>
                {task.status === "completed" ? (
                  <div className="text-green-400 font-semibold">
                    Completed
                  </div>
                ) : (
                  <button
                    onClick={() => completeTask(task.id)}
                    className="bg-gold-400 text-black font-semibold px-4 py-2 rounded-xl"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-10 text-center">
        <Link
          to="/dashboard"
          className="text-gold-400 underline text-sm"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Social;
