import React from 'react';
import { Track } from '../types';

interface PlaylistProps {
  tracks: Track[];
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Playlist: React.FC<PlaylistProps> = ({ tracks, currentTrack, onSelectTrack, onFileUpload }) => {
  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px', marginTop: '20px' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#00ffcc' }}>📁 BIBLIOTECA MUSICAL</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'inline-block', backgroundColor: '#ff007f', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
          ➕ CARGAR MP3 PROPIO
          <input type="file" accept="audio/*" multiple onChange={onFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tracks.map(track => {
          const isSelected = currentTrack?.id === track.id;
          return (
            <div 
              key={track.id} 
              onClick={() => track.url && onSelectTrack(track)} 
              style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                background: isSelected ? 'rgba(0, 255, 204, 0.1)' : '#020617', 
                border: '1px solid', 
                borderColor: isSelected ? '#00ffcc' : '#1e293b', 
                cursor: track.url ? 'pointer' : 'not-allowed', 
                opacity: track.url ? 1 : 0.5, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                transition: 'all 0.2s' 
              }}
            >
              <span style={{ fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#00ffcc' : '#f8fafc' }}>{track.name}</span>
              <span style={{ fontSize: '12px', color: track.url ? '#10b981' : '#64748b' }}>{track.url ? '▶ Listo' : '⚠️ Sin archivo'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};