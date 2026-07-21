# Changelog

## [v0.3.0-rc3] - 2026-07-09

### Added
- Full library experience inside the existing VIBRA panel with search, filters, playlists, smart playlists, favorites, and recent history.
- Progressive web app readiness with manifest support and offline-capable build configuration using the existing Vite PWA plugin.

### Changed
- Refined player and mood-panel interactions while preserving the existing HBG orchestration architecture.
- Polished responsive spacing, empty states, and cyberpunk UI consistency across the library experience.

### Fixed
- Stabilized catalog refresh behavior, playlist interactions, and UI state consistency across the release candidate flow.

## [v0.2.0-rc2] - 2026-07-08

### Added
- Premium UI experience for player controls, equalizer-style presets, and live mood panels.
- Reactive catalog synchronization through the shared event bus for hydration, add/update/remove flows.
- Predictive AutoDJ queue refill based on mood, tempo, and recent playback feedback.
- Persistent playback interaction memory for future recommendation tuning.

### Changed
- Reworked the core architecture around HBG orchestration with a more resilient, modular engine flow.
- Connected the mood engine to the local catalog for catalog-backed recommendations.
- Strengthened TypeScript typing and production build stability across the sprint cycle.

### Fixed
- Improved offline-first fallback behavior for recommendation and playlist generation.
- Stabilized UI updates so live catalog and audio state changes remain smooth and non-blocking.

## [v0.1.0] - 2026-07-07

### Added
- Initial VIBRA experience with mood-based UI and local playback foundation.
- Basic engine structure for AI recommendation, memory persistence, and player control.

### Changed
- Established the first functional architecture around mood, player, and state modules.

### Fixed
- Initial cleanup of the project structure and build pipeline for the Vite + TypeScript app.
