# VIBRA PRO

VIBRA PRO is the AI music experience inside the Universo HBG, designed as a high-performance, offline-ready sound system that reacts to mood, catalog state, and playback behavior in real time.

## Project Definition
VIBRA PRO is an intelligent audio experience that blends a reactive local music catalog, an adaptive AutoDJ engine, and a live mood-driven interface. The system is built for immersive, low-latency interaction with strong TypeScript architecture and graceful offline fallbacks.

## Core Features
- Audio PRO controls with equalizer-style presets for vibrant, warm, bass, and treble listening profiles.
- Reactive indexing catalog that updates instantly when local tracks are hydrated, added, updated, or removed.
- AutoDJ 2.0 predictive queue replenishment based on active mood, tempo, and playback frequency.
- Live Mood Panel that reflects the current emotional state and previews upcoming predictive tracks.
- Persistent memory layer for playback interactions and user preferences.

## Architecture
The application uses a modular TypeScript stack centered around the HBG core orchestration layer:

- src/core/hbgCore.ts — primary orchestration layer for state, playback, and intelligence
- src/core/moodEngine.ts — mood-driven recommendations and tempo-aware selection
- src/core/autodj.ts — predictive queue management and intelligent refill logic
- src/core/musicCatalog.ts — reactive in-memory catalog indexing and smart playlist matching
- src/core/memoryEngine.ts — local persistence for preferences, history, and playback feedback
- src/components/ — presentation layer for the live player, mood experience, and control center

## Development Status
Release Candidate 3 (RC-3) is now in a stable, compiled state for production-style verification.

## Verification
Run the following commands locally:

```bash
npm run typecheck
npm run build
```
