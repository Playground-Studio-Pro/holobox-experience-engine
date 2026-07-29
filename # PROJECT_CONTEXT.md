# PROJECT_CONTEXT.md

# Current Objective

Deliver a functional Trophy Orbit demo for the Golf Tournament.

Deadline

August 3

---

# Current Experience

Trophy Orbit

---

# Current Sprint

Demo Experience (Golf) — Ticket 0010

---

# Technology

React

TypeScript

Vite

PixiJS

GSAP

Electron (later)

---

# Current Decisions

CenterPiece supports

- Physical
- Digital

Development placeholder enabled.

Glorifier placeholder enabled.

Eight visible orbit items.

Unlimited photo library.

Configuration driven.

Offline First.

---

# Out of Scope

Cloud

CMS

Analytics

AI

Admin Panel

Remote Updates

---

# Next Milestone

Interactive demo running locally.

---

# Success Criteria

Physical trophy placeholder.

Orbiting photos.

Touch interaction.

Expanded gallery.

Auto reset.

Fullscreen.

---

# Current Status

Engine foundation completed.

---

# Completed

- Repository Foundation
- Render Engine
- Scene System
- CenterPiece System
- Orbit Engine
- Motion Engine
- Touch Engine
- Gallery Module
- Experience Configuration

---

# Current Architecture

- Configuration-driven engine
- ProjectLoader implemented
- Experience component introduced
- Physical/Digital CenterPiece
- Scene State Machine
- Orbit Engine
- Motion Engine
- Gallery State
- Transparent Renderer

---

# Current Demo

- Transparent renderer
- Physical placeholder
- Orbiting placeholder cards
- Touch interaction
- Focus state
- Gallery transition
- Premium layered glow
- Configuration loaded from project.json

---

# Next Sprint

## 0010 Demo Experience

### Objectives

- Replace placeholders with real golf assets
- Premium player cards
- Trophy placeholder refinement
- Gallery UI polish
- Motion polish
- Demo recording

### Known Risks

- Test on actual Holobox hardware
- Validate touchscreen responsiveness
- Verify transparent playback on target PC

---

# End of Day — 2026-07-29

## Sprint 1 Complete

Closed all nine engine foundation tickets in a single session.

## What shipped today

**Tickets 0006–0009 implemented.**

Tickets 0001–0005 were already complete entering today.

### Motion Engine (0006)

Constant orbit with per-item float offsets driven by independent phase values so items never bob in sync. Speed transitions use exponential ease for frame-rate-independent feel. Slow Motion API ready for touch.

### Touch Engine (0007)

Hit testing on OrbitItems via PixiJS pointer events. Tap selects an item: glow + scale up, others dim, orbit slows. Tap outside or 5-second timeout returns to Idle. SceneStateMachine extracted as a standalone class with guarded transitions — InteractionEngine no longer owns the full interaction flow.

### Gallery Module (0008)

Gallery is a scene state, not a modal or overlay. The selected OrbitItem detaches from the orbit engine and animates in-place to a configurable gallery position. CenterPiece stays visible. Remaining items keep orbiting at reduced opacity and slow speed. On close, the item travels back to its live orbit position (tracked every frame even while detached) and reattaches seamlessly.

### Experience Configuration (0009)

Engine is now fully configuration-driven end to end.

- `public/project.json` served statically by Vite — swap per deployment without recompile
- `ProjectLoader` fetches and deep-merges with defaults at boot; falls back to defaults silently
- `Root` is now an async loading shell; `Experience` receives a resolved `ProjectConfig`
- No hook reads `DEFAULT_CONFIG` directly anymore
- `OrbitEngine.mount()` is async — loads photo textures via `Assets.load()` before creating items
- `projects/golf/project.json` updated as the canonical source for the Golf demo

### Premium Glow System (part of 0009)

`PhotoItem` rewritten with three blur layers stacked behind the card surface:

- Shadow — BlurFilter 16, offset +14px Y
- Outer glow — BlurFilter 28, wide soft bloom
- Inner glow — BlurFilter 10, keeps card edge luminous

Focus sequence: glow peaks at 130ms, scale breathes in 80ms later via `back.out` easing. When transitioning to Gallery, `fadeGlowForGallery()` fades all three layers over the exact travel duration so the glow dissolves as the card floats — not before, not after.

## State at end of day

Engine is feature-complete for the demo. All systems are wired, animated, and configuration-driven. The next session begins Ticket 0010: replacing placeholder cards with real golf player photos, refining the trophy placeholder, and polishing the gallery for demo recording.
