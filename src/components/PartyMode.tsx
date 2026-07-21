import React, { useEffect, useRef, useState } from 'react';
import { hbgCore } from '../core/hbgCore';

const BAR_COLOR_START = '#5b7dff';
const BAR_COLOR_END = '#9933ff';
const PARTICLE_EMOJIS = ['🎵', '🎶', '✨', '⭐', '💫'];
const BASS_BIN_COUNT = 6; // primeras bandas de frecuencia = graves, para detectar "golpes"
const BASS_HIT_THRESHOLD = 190; // 0-255, umbral de energía para disparar una partícula
const BASS_HIT_COOLDOWN_MS = 140;

interface Particle {
  id: number;
  left: number;
  top: number;
  emoji: string;
}

export const PartyMode: React.FC = () => {
  const [isPartyActive, setIsPartyActive] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hasAudioSignal, setHasAudioSignal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataBufferRef = useRef<Uint8Array | null>(null);
  const lastParticleAtRef = useRef(0);
  const particleIdRef = useRef(0);

  const handlePartyToggle = () => {
    if (!isPartyActive) {
      hbgCore.changeMood('party');
      hbgCore.setVolume(100);
      setIsPartyActive(true);
    } else {
      setIsPartyActive(false);
      setParticles([]);
    }
  };

  useEffect(() => {
    if (!isPartyActive) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const drawFrame = () => {
      const canvas = canvasRef.current;
      const analyser = hbgCore.getAnalyserNode();

      if (canvas && analyser) {
        if (!dataBufferRef.current || dataBufferRef.current.length !== analyser.frequencyBinCount) {
          dataBufferRef.current = new Uint8Array(analyser.frequencyBinCount);
        }
        const data = dataBufferRef.current;
        analyser.getByteFrequencyData(data);

        setHasAudioSignal(true);
        renderBars(canvas, data);
        maybeSpawnParticle(data);
      } else {
        setHasAudioSignal(false);
        if (canvas) {
          renderIdleState(canvas);
        }
      }

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    animationFrameRef.current = requestAnimationFrame(drawFrame);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartyActive]);

  const maybeSpawnParticle = (data: Uint8Array) => {
    let bassEnergy = 0;
    for (let i = 0; i < BASS_BIN_COUNT; i += 1) {
      bassEnergy += data[i] ?? 0;
    }
    bassEnergy /= BASS_BIN_COUNT;

    const now = performance.now();
    if (bassEnergy >= BASS_HIT_THRESHOLD && now - lastParticleAtRef.current > BASS_HIT_COOLDOWN_MS) {
      lastParticleAtRef.current = now;
      particleIdRef.current += 1;

      const particle: Particle = {
        id: particleIdRef.current,
        left: Math.random() * 100,
        top: Math.random() * 100,
        emoji: PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)],
      };

      setParticles((current) => [...current.slice(-24), particle]);

      window.setTimeout(() => {
        setParticles((current) => current.filter((p) => p.id !== particle.id));
      }, 1200);
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
        <>
          <div className="party-visualizer">
            <canvas ref={canvasRef} width={600} height={160} className="party-visualizer-canvas" />
            {!hasAudioSignal && (
              <div className="party-visualizer-hint">Reproduce una canción para ver el visualizador en vivo</div>
            )}
          </div>

          <div className="party-particles">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="particle"
                style={{ left: `${particle.left}%`, top: `${particle.top}%` }}
              >
                {particle.emoji}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function renderBars(canvas: HTMLCanvasElement, data: Uint8Array): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, height, 0, 0);
  gradient.addColorStop(0, BAR_COLOR_START);
  gradient.addColorStop(1, BAR_COLOR_END);
  ctx.fillStyle = gradient;

  // Usamos solo la mitad "útil" del espectro (las frecuencias más altas
  // suelen tener muy poca energía y aplanan visualmente la gráfica).
  const usableBins = Math.floor(data.length * 0.6);
  const barCount = 48;
  const samplesPerBar = Math.max(1, Math.floor(usableBins / barCount));
  const barWidth = width / barCount;
  const gap = barWidth * 0.25;

  for (let bar = 0; bar < barCount; bar += 1) {
    let sum = 0;
    const start = bar * samplesPerBar;
    for (let i = 0; i < samplesPerBar; i += 1) {
      sum += data[start + i] ?? 0;
    }
    const average = sum / samplesPerBar;
    const barHeight = Math.max(2, (average / 255) * height);

    const x = bar * barWidth + gap / 2;
    const y = height - barHeight;
    ctx.fillRect(x, y, barWidth - gap, barHeight);
  }
}

function renderIdleState(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(91, 125, 255, 0.15)';

  const barCount = 48;
  const barWidth = width / barCount;
  const gap = barWidth * 0.25;

  for (let bar = 0; bar < barCount; bar += 1) {
    const x = bar * barWidth + gap / 2;
    const barHeight = 3;
    ctx.fillRect(x, height - barHeight, barWidth - gap, barHeight);
  }
}
