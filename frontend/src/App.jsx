import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Level1Page from "./pages/Level1Page";
import TasksPage from "./pages/TasksPage";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <nav style={{ padding: 20, background: "#222" }}>
        <Link to="/" style={{ marginRight: 20, color: "white" }}>Home</Link>
        <Link to="/level1" style={{ marginRight: 20, color: "white" }}>Level 1</Link>
        <Link to="/tasks" style={{ color: "white" }}>Tasks</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage setUser={setUser} user={user} />} />
        <Route path="/level1" element={<Level1Page user={user} />} />
        <Route path="/tasks" element={<TasksPage user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}
