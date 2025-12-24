import { useEffect, useState } from "react";

export default function HomePage() {
  const [tgUser, setTgUser] = useState(null);
  const [phone, setPhone] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // Expand WebApp to full height
    tg?.expand();

    // Get Telegram user object
    const user = tg?.initDataUnsafe?.user;

    console.log("Telegram user:", user);

    if (user) {
      setTgUser(user);
    }

    // Listen for contact (phone number)
    tg?.onEvent("contactRequested", (data) => {
      console.log("Phone received:", data);
      setPhone(data?.phone_number || null);
    });
  }, []);

  const requestPhone = () => {
    const tg = window.Telegram?.WebApp;
    tg?.requestContact();
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Telegram User Info</h1>

      {!tgUser && (
        <p style={{ color: "red" }}>
          No Telegram user detected — open this WebApp inside Telegram.
        </p>
      )}

      {tgUser && (
        <div style={{ marginTop: 20 }}>
          <p><b>ID:</b> {tgUser.id}</p>
          <p><b>Username:</b> {tgUser.username}</p>
          <p><b>First Name:</b> {tgUser.first_name}</p>
          <p><b>Last Name:</b> {tgUser.last_name}</p>
          <p><b>Language:</b> {tgUser.language_code}</p>

          {tgUser.photo_url && (
            <img
              src={tgUser.photo_url}
              alt="Profile"
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                marginTop: 20
              }}
            />
          )}

          <hr style={{ margin: "30px 0" }} />

          <h2>Phone Number</h2>

          {phone ? (
            <p><b>{phone}</b></p>
          ) : (
            <button
              onClick={requestPhone}
              style={{
                padding: "10px 20px",
                background: "#0088cc",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16
              }}
            >
              Share Phone Number
            </button>
          )}
        </div>
      )}
    </div>
  );
}
