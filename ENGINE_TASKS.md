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

## Phases

### 0010-A — Demo Floor

Status: DONE ✅

-   Physical CenterPiece mode enabled
-   All dev overlays disabled in project.json and projects/golf/project.json
-   Gallery close button (CLOSE pill, animated in/out, kiosk hit area)
-   PlayerCard built as the final reusable orbit item — replaces PhotoItem
-   PlayerData contract defined (name, country, rank, score, photoUrl)
-   OrbitEngine supports `players` (structured) and `photos` (legacy) arrays
-   TypeScript: zero errors

### 0010-B — Visual Quality and Real Assets

Status: DONE ✅

-   Glorifier redesigned as premium trophy pedestal (dark metal, gold accents, animated beam + halo)
-   showGlorifier re-enabled — centerpiece is no longer empty
-   8 portrait photos downloaded to `public/assets/photos/` as temporary stock placeholders
-   `assets.players` populated with placeholder player data (names, countries, scores) and photo paths
-   PlayerCard photo zone masked to card roundRect — photo corners clip correctly
-   setTexture() uses cover-crop scaling — no distortion, overflow clipped by mask
-   Avatar placeholder replaced with person silhouette outline; hides on photo load
-   loadPlayerTextures returns (Texture | null)[] — 1:1 indexed with players, prevents mismatch
-   NOTE: current photos are 128×128 stock portraits (not actual golfers). Replace with 400×500+ golf photography before production demo.

### 0010-C — Interaction Flow Overhaul

Status: DONE ✅

-   Orbit mode: photos orbit CenterPiece with front/back layer depth routing (unchanged)
-   Focus mode: one tap on any orbit item opens FocusView — hero photo overlay, contain-scaled up to 840×700px
-   FocusView: prev/next chevron arrows for browsing without returning to orbit; "VIEW ALL" pill button; player name + country/score below photo; backdrop tap closes and returns to orbit
-   Gallery mode: "VIEW ALL" opens GridGallery — full-screen dark overlay with 3-column thumbnail grid (260×260, cover-cropped, rounded rect mask); tap thumbnail re-enters Focus mode on that player; close button (×) or backdrop tap returns to orbit
-   SceneStateMachine: added `focused → focused` (player switching) and `gallery → focused` transitions
-   InteractionEngine: one-tap to focused (no second-tap to gallery), no auto-timeout, tracks focusedIndexSlot alongside focusedItemSlot, orbit items remain in orbit (nothing detaches), item taps ignored while gallery is open
-   GalleryModule deleted — replaced by FocusView + GridGallery
-   All textures loaded from PixiJS Assets cache (Assets.get) — no reloading
-   Architected around generic photo memories (PlayerData is generic; not golf-specific)
-   TypeScript: zero errors

### 0010-D — UX Polish Pass

Status: DONE ✅

-   `showCardFooter` config option added to `orbit` section — when `false`, card renders photo-only (image fills full card, no name/country/score/divider/footer background); when `true`, original footer preserved
-   Set `showCardFooter: false` in both `project.json` and `projects/golf/project.json`
-   FocusView redesigned as transparent glass panel: backdrop alpha 0.52 (orbit and centerpiece softly visible), dark navy glass panel (0x03080f, alpha 0.78) with top-edge highlight and subtle border, explicit Close (×) button at top-right corner, prev/next arrows with circle backgrounds for clarity, VIEW ALL pill below photo, panel event isolation via `hitArea` + `stopPropagation` — clicking photo/controls/panel never closes
-   GridGallery rebuilt with scroll: fixed header (GALLERY + close button, opaque bg, divider line), clipped scrollable content area via PixiJS mask, drag-to-scroll (pointermove on root) and mouse-wheel scroll, tap vs drag distinguished by pointer movement threshold (< 12px = tap), clicking anywhere inside gallery (between thumbnails, on header bg) does not close — only close button (×) does; thumbnail count: 16 photos in 6 rows × 3 columns, max scroll ~178px

### 0010-E — Content Polish

Status: TODO

-   Final layout / scale tuning for Holobox screen dimensions
-   Motion profile fine-tuning
-   Optional: typography adjustments based on real photos

### 0010-E — Demo Prep

Status: TODO

-   Hardware test on Holobox device
-   Touch responsiveness validation
-   Transparent playback verification
-   Demo recording

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
Engine is now fully configuration-driven. `project.json` is served statically and loaded at boot by `ProjectLoader`, which deep-merges against defaults. `Root` is an async shell that waits for config before mounting `Experience`. No hook reads `DEFAULT_CONFIG` directly. `OrbitEngine.mount()` is async and loads photo textures via `Assets.load()` before creating items. Premium glow system added to orbit items: three blur layers (shadow, outer glow, inner glow) with a sequenced focus animation where glow peaks before the card starts moving, and fades over the exact travel duration when entering Gallery.

------------------------------------------------------------------------

# Sprint 2 Summary (in progress)

## 0010-A — Demo Floor

**Outcome:** Engine renders demo-ready content. Dev overlays removed. Gallery closeable. PlayerCard component built.

**Physical CenterPiece**
`project.json` and `projects/golf/project.json` updated to `"mode": "physical"` with all dev overlays set to `false`. The engine now renders a clean exclusion zone where the physical trophy lives — no crosshair, placeholder boxes, or safe zone markers.

**Gallery Close Button**
`GalleryModule` creates a pill-shaped CLOSE button at construction. On `open()`, the button is added to the ui layer and fades in after the card lands. On `close()`, it fades out and detaches. The button's position is config-driven via `gallery.closeButtonY` (default: `targetY + 350`). Hit area is 180×84px for reliable kiosk touch response. `stopPropagation()` prevents the stage tap handler from firing.

**PlayerCard — Final Reusable Component**
`PhotoItem` deleted. `PlayerCard` is the sole orbit item implementation. Card layout: 140×180px, RADIUS 12, FOOTER_H 58. Photo zone occupies the upper 122px. Gold (0xd4af37) glow layers replace the white glow of the previous placeholder — matches tournament theme. Gold accent line separates photo zone from footer. Text labels (name 11px bold, country 9px, score/rank 9px gold) display at 35% opacity when data is absent and animate to full opacity when real data is set.

**PlayerData Contract**
`PlayerData` interface defined in `config/types.ts`: `name`, `country`, `rank`, `score`, `photoUrl` — all optional for graceful degradation. `AssetsConfig.players?: PlayerData[]` added alongside the existing `photos` array. `OrbitEngineConfig.players?: PlayerData[]` added. `useOrbit` passes `assets.players` to the engine. When `players` is non-empty, the engine reads `photoUrl` per player and loads textures; when empty, falls back to the flat `photos` array. Both `project.json` files updated with empty `players: []` ready for real data.

**Next:** 0010-B — populate `assets.players` with real golf photos and player metadata.
