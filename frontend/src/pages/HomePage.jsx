import { useEffect } from "react";
import Antz from "../lib/Antz";

export default function HomePage({ setUser }) {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;

      // overwrite Antz.js object in memory
      Antz.id = u.id;
      Antz.username = u.username || `user${u.id}`;
      Antz.first_name = u.first_name || "";
      Antz.photo_url = u.photo_url || "";

      // save to localStorage
      localStorage.setItem("user", JSON.stringify(Antz));

      // send to app state
      setUser(Antz);
    } else {
      console.log("Not inside Telegram WebApp");
    }
  }, [setUser]);

  return (
    <div style={{ padding: 40 }}>
      <h1>Home Page</h1>
      <p>Logged in as: <b>{Antz.username || "Unknown"}</b></p>
    </div>
  );
}
