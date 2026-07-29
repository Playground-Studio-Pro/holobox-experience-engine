# ENGINE_TASKS.md

# Holobox Experience Engine --- MVP Backlog

## Purpose

This document is the execution backlog for the engine. Claude Code must
implement **one ticket at a time** and wait for approval before moving
to the next ticket.

------------------------------------------------------------------------

# 0001 --- Repository Foundation

## Goal

Create the project foundation.

## Deliverables

-   React
-   TypeScript
-   Vite
-   PixiJS
-   GSAP
-   ESLint
-   Prettier
-   Folder structure
-   npm scripts

## Acceptance Criteria

-   Project builds successfully.
-   `npm run dev` works.
-   `npm run build` works.
-   No TypeScript errors.

Status: DONE ✅

------------------------------------------------------------------------

# 0002 --- Render Engine

## Goal

Render a fullscreen 9:16 scene.

## Acceptance Criteria

-   1080×1920 virtual canvas
-   Responsive scaling
-   Fullscreen
-   60 FPS target

Status: DONE ✅

------------------------------------------------------------------------

# 0003 --- Scene System

## Goal

Create the Scene manager.

## Contains

-   CenterPiece
-   Orbit Layer
-   Effects Layer
-   UI Layer

Status: DONE ✅

------------------------------------------------------------------------

# 0004 --- CenterPiece System

## Goal

Create the reusable CenterPiece component.

## Features

-   Physical Mode
-   Digital Mode
-   Placeholder Toggle
-   Glorifier Toggle
-   Safe Zone Toggle

Status: DONE ✅

------------------------------------------------------------------------

# 0005 --- Orbit Engine

## Goal

Render orbiting content.

## Acceptance Criteria

-   8 visible orbit items
-   Elliptical orbits
-   Depth simulation
-   Exclusion zone respected

Status: DONE ✅

------------------------------------------------------------------------

# 0006 --- Motion Engine

## Goal

Implement layered motion.

## Includes

-   Orbit
-   Float
-   Pulse
-   Glow
-   Scale
-   Tilt

Status: DONE ✅

------------------------------------------------------------------------

# 0007 --- Touch Engine

## Goal

Scene-wide interaction.

## Flow

Touch → Slow orbit → Highlight selection → Expand item → Enter Gallery

Status: DONE ✅

------------------------------------------------------------------------

# 0008 --- Gallery Module

## Goal

Display selected content.

## Features

-   Next
-   Previous
-   Close
-   Return to Orbit
-   Auto Reset

Status: DONE ✅

------------------------------------------------------------------------

# 0009 --- Experience Configuration

## Goal

Load experiences from `project.json`.

## Supports

-   Theme
-   Photos
-   Motion
-   CenterPiece
-   UI

Status: DONE ✅

------------------------------------------------------------------------

# 0010 --- Demo Experience (Golf)

## Goal

Deliver the commercial demo.

## Assets

-   Trophy
-   Golf photos
-   Theme
-   Motion profile

Status: TODO

------------------------------------------------------------------------

# 0011 --- Electron Packaging

## Goal

Package as a kiosk application.

Status: TODO

------------------------------------------------------------------------

# 0012 --- Performance Pass

## Goal

Optimize the engine.

## Targets

-   60 FPS
-   Stable memory usage
-   Fast startup

Status: TODO

------------------------------------------------------------------------

# Sprint 1 Summary

**Tickets completed:** 0001 – 0009
**Outcome:** Engine is fully functional and configuration-driven. Ready to receive production assets for the Golf Tournament demo.

## What was built

**Foundation (0001–0003)**
Monorepo scaffolded with React, TypeScript, Vite, PixiJS v8, and GSAP. Renderer initializes a 1080×1920 canvas with responsive scaling, transparent background, and 60 FPS cap. Scene system manages named layers (background, centerpiece, orbitBack, orbitFront, effects, ui) with correct draw-order guarantees.

**CenterPiece (0004)**
Physical and Digital modes. Physical mode reserves a configurable exclusion zone. Development overlays (Placeholder, Glorifier, Safe Zone) are individually togglable via config.

**Orbit Engine (0005)**
Eight PhotoItems orbit on a configurable ellipse with correct depth simulation: scale 0.65–1.0 and alpha 0.4–1.0 driven by sin(angle). Items route between orbitBack and orbitFront layers each frame. Two-level container design (outer for depth, inner for focus animations) prevents transform conflicts.

**Motion Engine (0006)**
Constant orbit with per-item float offsets. Speed transitions via exponential ease (frame-rate independent). Slow Motion API reduces orbit speed to a configurable scale factor, with smooth ramp-in and ramp-out.

**Touch Engine (0007)**
Hit testing on OrbitItems. Tapping an item enters Focus state: item gains glow and scale, others dim, orbit enters slow motion. Tapping outside or a 5-second timeout returns to Idle. SceneStateMachine extracted as a separate class with explicit valid-transition rules (idle → focused → gallery → idle).

**Gallery Module (0008)**
Gallery is a scene state, not a modal. The selected OrbitItem detaches from the orbit engine and animates in-place to a gallery position. The CenterPiece remains visible. Remaining items continue orbiting at reduced opacity. On close, the item animates back to its live orbit position (tracked every frame even while detached) and reattaches.

**Experience Configuration (0009)**
Engine is now fully configuration-driven. `project.json` is served statically and loaded at boot by `ProjectLoader`, which deep-merges against defaults. `Root` is an async shell that waits for config before mounting `Experience`. No hook reads `DEFAULT_CONFIG` directly. `OrbitEngine.mount()` is async and loads photo textures via `Assets.load()` before creating items. Premium glow system added to `PhotoItem`: three blur layers (shadow, outer glow, inner glow) with a sequenced focus animation where glow peaks before the card starts moving, and fades over the exact travel duration when entering Gallery.
