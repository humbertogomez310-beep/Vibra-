interface HeaderProps { systemAlert: string; }
function Header({ systemAlert }: HeaderProps) { return ( <> <h1 style={{ letterSpacing: "4px", fontSize: "2.4rem", marginBottom: "8px", color: "#00ffcc" }}> 🎧 VIBRA PRO </h1> <p style={{ color: "#ff007f", fontWeight: "bold", marginBottom: "25px" }}> ⚡ SYSTEM STATUS: {systemAlert} </p> </> ); }
export default Header;
