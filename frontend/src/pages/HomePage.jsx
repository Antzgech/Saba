import { useEffect } from "react";
import Antz from "../lib/Antz";

export default function HomePage({ setUser, user }) {
  useEffect(() => {
    localStorage.setItem("token", "dev-token");
    localStorage.setItem("user", JSON.stringify(Antz));
    setUser(Antz);
  }, [setUser]);

  return (
    <div style={{ padding: 40 }}>
      <h1>Home Page</h1>
      <p>You are logged in as: <b>{user?.username || "Loading..."}</b></p>

      <p>Use the navigation bar to test pages.</p>
    </div>
  );
}
