import React, { useState, useEffect } from "react";

interface LocalSong {
  id: string;
  name: string;
  url: string;
}

export const MusicLibrary: React.FC = () => {
  const [songs, setSongs] = useState<LocalSong[]>([]);

  useEffect(() => {
    const savedSongs = localStorage.getItem("vibra-library");

    if (savedSongs) {
      setSongs(JSON.parse(savedSongs));
    }
  }, []);

  const handleUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (!files) return;

    const newSongs = Array.from(files).map((file) => ({
      id: Date.now().toString() + file.name,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    const updatedSongs = [...songs, ...newSongs];

    setSongs(updatedSongs);

    localStorage.setItem(
      "vibra-library",
      JSON.stringify(updatedSongs)
    );
  };

  const deleteSong = (id: string) => {
    const updatedSongs = songs.filter(song => song.id !== id);

    setSongs(updatedSongs);

    localStorage.setItem(
      "vibra-library",
      JSON.stringify(updatedSongs)
    );
  };

  return (
    <div className="player">
      <h2>🎵 Biblioteca VIBRA</h2>

      <input
        type="file"
        multiple
        accept="audio/*"
        onChange={handleUpload}
      />

      <br />
      <br />

      {songs.map(song => (
        <div key={song.id}>
          🎶 {song.name}

          <button onClick={() => deleteSong(song.id)}>
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
};
