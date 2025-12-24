export default function TasksPage({ user }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>Tasks Page</h1>
      <p>Current user: <b>{user?.username}</b></p>

      <ul>
        <li>Task 1 — Subscribe</li>
        <li>Task 2 — Join Telegram</li>
        <li>Task 3 — Follow Facebook</li>
      </ul>
    </div>
  );
}
