import { useEffect, useState } from "react";
import Antz from "../lib/Antz";

export default function HomePage({ setUser }) {
  const [tgUser, setTgUser] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;

      Antz.id = u.id;
      Antz.username = u.username || `user${u.id}`;
      Antz.first_name = u.first_name || "";
      Antz.photo_url = u.photo_url || "";

      localStorage.setItem("user", JSON.stringify(Antz));
      setUser(Antz);
      setTgUser(Antz);
    } else {
      console.log("Not inside Telegram WebApp");
    }
  }, [setUser]);

  return (
    <div style={{ padding: 40 }}>
      <h1>Home Page</h1>

      {tgUser ? (
        <p>Logged in as: <b>{tgUser.username}</b></p>
      ) : (
        <p style={{ color: "red" }}>No Telegram user detected</p>
      )}
    </div>
  );
}
