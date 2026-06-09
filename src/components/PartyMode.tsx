import React, { useState } from 'react';
import { hbgCore } from '../core/hbgCore';

export const PartyMode: React.FC = () => {
  const [isPartyActive, setIsPartyActive] = useState(false);
  const [particleCount, setParticleCount] = useState(0);

  const handlePartyToggle = () => {
    if (!isPartyActive) {
      // Activar modo party
      hbgCore.changeMood('party');
      hbgCore.setVolume(100);
      setIsPartyActive(true);
      setParticleCount(30);

      // Animar confeti simulado
      const timer = setInterval(() => {
        setParticleCount((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 100);
    } else {
      setIsPartyActive(false);
      setParticleCount(0);
    }
  };

  return (
    <div className={`party-mode ${isPartyActive ? 'active' : ''}`}>
      <button
        className="party-btn"
        onClick={handlePartyToggle}
        title="Activar/Desactivar Modo Fiesta"
      >
        {isPartyActive ? '🎉 ¡FIESTA! 🎉' : '🎉 Party Mode'}
      </button>

      {isPartyActive && (
        <div className="party-particles">
          {Array.from({ length: particleCount }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            >
              {['🎵', '🎶', '✨', '⭐', '💫'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
