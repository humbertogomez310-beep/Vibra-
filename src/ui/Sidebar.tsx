function Sidebar() {
  return (
    <div
      style={{
        width: "220px",
        height: "100vh",
        backgroundColor: "#111",
        color: "#00ffcc",
        padding: "20px",
        borderRight: "2px solid #00ffcc",
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ marginBottom: "30px" }}>🎧 VIBRA PRO</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <button>🏠 Inicio</button>
        <button>🎵 Biblioteca</button>
        <button>❤️ Favoritos</button>
        <button>📻 Playlist</button>
        <button>🎉 Party</button>
        <button>🎯 Focus</button>
        <button>😴 Sleep</button>
        <button>⚙ Ajustes</button>
      </div>
    </div>
  );
}

export default Sidebar;
