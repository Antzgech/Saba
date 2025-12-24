export default function Level1Page({ user }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>Level 1</h1>
      <p>Current user: <b>{user?.username}</b></p>

      <p>This is a simple test page for Level 1.</p>
    </div>
  );
}
