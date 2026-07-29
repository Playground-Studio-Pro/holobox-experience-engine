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

Demo Experience (Golf) — Ticket 0010, Phase B

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

CenterPiece mode: Physical.

Development overlays: disabled in production config.

Eight visible orbit items.

Unlimited player library via `assets.players` in project.json.

Legacy `assets.photos` kept for backward compatibility.

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

Interactive demo running locally with real golf assets.

---

# Success Criteria

Physical trophy zone reserved (no dev overlays).

Orbiting player cards with real photos.

Touch interaction.

Gallery with close button.

Auto reset.

Fullscreen.

---

# Current Status

0010-A through 0010-D complete. Gallery and Focus UX blocking issues resolved. Cards are photo-only (no footer). FocusView is a transparent glass panel. GridGallery is scrollable with a fixed header. Event isolation is correct in both views. 16 real golf photos in place.

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
- 0010-A — Demo Floor
- 0010-B — Visual Quality and Real Assets
- 0010-C — Interaction Flow Overhaul

---

# Current Architecture

- Configuration-driven engine
- ProjectLoader implemented
- Experience component introduced
- Physical CenterPiece (dev overlays off)
- Scene State Machine (idle / focused / gallery, with self-transitions)
- Orbit Engine with PlayerCard (items always stay in orbit; `showCardFooter` config)
- Motion Engine
- FocusView: transparent glass panel, hero photo, prev/next arrows, close button, VIEW ALL
- GridGallery: fixed header, scrollable clipped grid, drag + wheel scroll, tap vs drag detection
- Transparent Renderer

---

# Current Demo

- Transparent renderer
- Physical centerpiece zone (clean — no dev overlays) with animated Glorifier pedestal
- Orbiting PlayerCards: photo-only mode (`showCardFooter: false`), gold glow on focus
- 16 real golf photos loaded from `/assets/photos/golf-01.jpg` through `golf-16.jpg`
- One tap → FocusView (glass panel, contain-scaled hero photo, ×close, prev/next, VIEW ALL)
- Prev/Next navigation browsing all 16 photos without leaving Focus
- VIEW ALL → GridGallery (fixed header, scrollable 3×6 grid, drag + wheel scroll)
- Thumbnail tap (< 12px movement) → Focus on that photo
- Close × or backdrop tap → returns to orbit
- Configuration loaded from project.json

---

# 0010 Phase Breakdown

## 0010-A — Demo Floor ✅ COMPLETE

- Physical CenterPiece mode enabled in project.json
- All dev overlays disabled (showPlaceholder, showGlorifier, showSafeZone = false)
- Gallery close button added — pill with CLOSE label, animated in/out, generous kiosk hit area
- PlayerCard built as final reusable orbit item — replaces PhotoItem entirely
- PlayerData contract defined in config/types.ts (name, country, rank, score, photoUrl)
- OrbitEngine supports both `players` (structured) and `photos` (legacy flat list)
- players/photos arrays in project.json ready to receive real assets

## 0010-B — Visual Quality and Real Assets ✅ COMPLETE

**Centerpiece restored**
`showGlorifier` re-enabled. Glorifier completely redesigned as a premium golf trophy pedestal:
- Multi-tier base in dark material with gold (0xd4af37) accent lines on each tier edge
- Upward light beam: 16px-wide blurred column rising from pedestal into the trophy zone
- Platform halo: blurred elliptical glow at the pedestal top surface
- Both beam and halo animated with independent GSAP sine pulses (2.8s and 2.1s respectively)
- No text label. No blue. Matches tournament color palette.

**Player cards with real photos**
8 portrait photos (128×128) downloaded to `public/assets/photos/player-01.jpg` through `player-08.jpg`.
`assets.players` in project.json populated with placeholder golf player names, countries, and scores.
Photos are generic portrait stock (not actual golf players) — flagged for replacement with real golf photography before final demo.

**PlayerCard quality fixes**
- Photo zone now masked to the card's rounded-rectangle shape using PixiJS Graphics mask. Photo corners are clipped correctly — no square-corner overflow.
- `setTexture()` uses cover-crop scaling: `Math.max(scaleX, scaleY)` fills the photo zone uniformly. Overflow is clipped by the mask.
- Avatar placeholder is a person silhouette (head circle + torso outline) in muted ring style. Hides automatically when a texture loads.
- Top-edge luminance added: 2px horizontal highlight at card top (10% white) — subtle premium detail.
- Gold border drawn outside the masked content container — always renders on top, never clipped.
- `loadPlayerTextures` fixed: returns `(Texture | null)[]` indexed 1:1 with players array. Prevents texture index mismatch when some players have no photoUrl.

**Known limitation**
Portrait photos are 128×128px. In gallery at 3× scale (408×360 display area), photos will be soft. Replace with 400×500+ source photos before production.

## 0010-C — Interaction Flow Overhaul ✅ COMPLETE

**FocusView (new)**
Replaces old GalleryModule. A full-screen dark overlay (alpha 0.68) placed in the ui layer. Hero photo displayed contain-scaled up to 840×700px centered at (540, 520). Prev/Next chevron arrows at canvas edges (x=55, x=1025) for player browsing. "VIEW ALL" pill at top center. Player name (30px bold) and country·score detail below photo. Backdrop captures taps to return to idle. Crossfade animation when switching players.

**GridGallery (new)**
Full-screen dark overlay (alpha 0.92). 3-column thumbnail grid: columns at x=[200, 540, 880], rows start y=220, 340px spacing. Thumbnails 260×260 with rounded rect mask (cover-crop). Player name overlay at thumbnail bottom. Tap any thumbnail → Focus mode on that player. Close button (×) at top right; backdrop tap also closes.

**SceneStateMachine**
Two new valid transitions: `focused → focused` (player switching) and `gallery → focused` (thumbnail tap re-enters focus without going through idle).

**InteractionEngine**
One-tap to focused (no longer two-tap). No auto-timeout. Tracks `focusedIndexSlot: { current: number }` (-1 when none). Orbit items stay in orbit — nothing detaches. Item taps ignored in gallery state (GridGallery owns that interaction).

**GalleryModule deleted** — replaced by FocusView + GridGallery.

## 0010-D — Content Polish

- Final layout / scale tuning for Holobox screen dimensions
- Motion profile fine-tuning
- Optional: typography adjustments based on real photos

## 0010-E — Demo Prep

- Hardware test on Holobox device
- Touch responsiveness validation
- Transparent playback verification on target PC
- Demo recording

---

# Known Risks

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

Three blur layers stacked behind the card surface:

- Shadow — BlurFilter 16, offset +14px Y
- Outer glow — BlurFilter 28, wide soft bloom
- Inner glow — BlurFilter 10, keeps card edge luminous

Focus sequence: glow peaks at 130ms, scale breathes in 80ms later via `back.out` easing. When transitioning to Gallery, `fadeGlowForGallery()` fades all three layers over the exact travel duration so the glow dissolves as the card floats — not before, not after.

---

# End of Session — 2026-07-29 (Sprint 2 begins)

## 0010-A Complete

### What shipped

**Physical CenterPiece**

`project.json` and `projects/golf/project.json` updated to `"mode": "physical"` with all dev overlays off. The engine now renders a clean transparent zone where the physical trophy lives. No crosshair, no placeholder boxes, no safe zone overlay.

**Gallery Close Button**

`GalleryModule` now creates a pill-shaped CLOSE button at boot. On `open()`, the button is added to the ui layer and fades in after the card lands (0.55s delay, 0.3s fade). On `close()`, it fades out and removes itself. Hit area is 180×84px for reliable kiosk touch. Position is config-driven via `gallery.closeButtonY` in project.json.

**PlayerCard — Final Reusable Component**

`PhotoItem` deleted. `PlayerCard` replaces it as the only orbit item. Key design decisions:

- Gold glow (0xd4af37) instead of white — matches tournament theme, feels premium on transparent display
- Photo zone (122px) + footer strip (58px) layout with gold accent separator line
- Avatar circle placeholder in photo zone — vanishes when real photo loaded via `setTexture()`
- Text labels: name (bold, 11px), country (9px), score/rank (gold, 9px) — all degrade to placeholder with 35% opacity if data is absent
- `setData(PlayerData)` updates labels independently from texture loading
- `setTexture(Texture)` adds sprite to photoContainer above placeholder

**PlayerData Contract**

Defined in `config/types.ts`:
- `name?: string`
- `country?: string`
- `rank?: number`
- `score?: string`
- `photoUrl?: string`

`AssetsConfig.players?: PlayerData[]` added. `OrbitEngineConfig.players?: PlayerData[]` added. `useOrbit` hook passes `assets.players` to engine. When `players.length > 0`, engine uses structured data and photo URLs; when empty, falls back to flat `photos` array.

### State at end of session

Engine renders premium gold-bordered player cards orbiting a clean centerpiece zone. Gallery is fully closeable. Real assets can be dropped in via project.json without touching code. TypeScript reports zero errors.
