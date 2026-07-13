import React, { useState, useRef } from "react";
import Header from "./ui/Header";
import { Playlist } from "./ui/Playlist";
import { Track, initialTracks } from "./types";

export default function App() {
  const [systemAlert] = useState("ALL SYSTEMS OPERATIONAL");
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const newTracks: Track[] = filesArray.map((file, index) => ({
      id: "user-" + Date.now() + "-" + index,
      name: file.name.replace(".mp3", ""),
      url: URL.createObjectURL(file),
    }));
    setTracks([...tracks, ...newTracks]);
  };

  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.play().catch((err) => console.log(err));
      }
    }, 50);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#f8fafc", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <Header systemAlert={systemAlert} />
        {currentTrack && (
          <div style={{ background: "linear-gradient(135deg, #0f172a, #1e1b4b)", padding: "20px", borderRadius: "16px", border: "1px solid #00ffcc", marginBottom: "20px" }}>
            <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#00ffcc" }}>REPRODUCIENDO AHORA</p>
            <h2 style={{ margin: 0, fontSize: "1.5rem" }}>{currentTrack.name}</h2>
            <audio ref={audioRef} controls src={currentTrack.url} style={{ width: "100%", marginTop: "15px" }} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
          </div>
        )}
        <Playlist tracks={tracks} currentTrack={currentTrack} onSelectTrack={handleSelectTrack} onFileUpload={handleFileUpload} />
      </div>
    </div>
  );
}
