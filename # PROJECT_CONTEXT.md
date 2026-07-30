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

Demo Experience (Golf) — Ticket 0010, Phase G (Content Pipeline + Decorations)

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

0010-A through 0010-D-1 complete. 0010-G (Content Pipeline + Decorations) complete.

23 real Gaby López photos now loading from `projects/golf/Fotos/`. 13 video clips
registered in the pipeline. Scene Decorations system built and ready.

**Next: 0010-D-2 — Idle Auto-Reset. Then 0010-E — Caption Pass + Content Polish.**

Digital CenterPiece (GLB) is explicitly DEFERRED until after August 3.

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
- 0010-D — UX Polish (fix: VIEW ALL first-tap bug)
- 0010-D-1 — Asset Pipeline and Build Repair
- 0010-G — Content Pipeline (real Gaby López assets, video structure)
- 0010-G — Scene Decorations (decorBack/decorFront layers, DecorationLayer)

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
- Content Pipeline: Vite plugin serves projects/ at /projects/ — no duplication
- Scene Decorations: decorBack + decorFront layers (disabled; ready for assets)
- PlayerData extended: mediaType (photo/video), videoUrl

---

# Current Demo

- Transparent renderer
- Physical centerpiece zone (clean — no dev overlays) with animated Glorifier pedestal
- Orbiting PlayerCards: photo-only mode (`showCardFooter: false`), gold glow on focus
- 23 real Gaby López photos loading from `/projects/golf/Fotos/` (original filenames)
- 13 video clips registered in content pipeline (not yet rendered)
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

Ordered by probability of killing the August 3 demo.

1. **Hardware has never been tested.** Highest risk by a wide margin. Nothing in
   this repository reduces it. Requires physical time with the Holobox display.
2. **Content is stock photography, not client content.** The 16 `golf-*.jpg`
   files are generic golf stock (country-club scenes, male amateur golfers).
   The actual Gaby López assets sit unused in `projects/golf/Fotos` (25 images)
   and `projects/golf/Videos` (13 clips, ~700 MB). A client watching their own
   athlete's story is a fundamentally different sale than a stock photo viewer.
3. **No captions.** `assets.players` carries `photoUrl` only. `FocusView`
   renders an empty name and empty detail line on every tap.
4. **No idle auto-reset.** A visitor who walks away mid-gallery leaves the
   installation stuck. See 0010-D-2.
5. Validate touchscreen responsiveness (< 50 ms target).
6. Verify transparent playback on target PC.

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

---

# End of Session — 2026-07-29 (0010-D-1)

## Asset Pipeline and Build Repair

Shipped one ticket. Both items were latent blockers, not enhancements.

### The photo assets were unshippable

The 16 files in `public/assets/photos` were untouched camera originals —
`golf-01.jpg` at 7039×5279, `golf-14.jpg` at 5304×7952. 61.9 MB on disk.

`OrbitEngine.mount()` awaits `loadPlayerTextures()` for **all 16** before the
first frame renders, so every one becomes a resident RGBA8 GPU texture:

| | before | after |
|---|---|---|
| disk | 61.9 MB | 5.1 MB |
| GPU texture memory | 1538 MB | 114 MB |
| largest single texture | 169 MB | 10 MB |

`golf-14.jpg` was also 7952 px on its long edge — within 240 px of the 8192 px
`MAX_TEXTURE_SIZE` ceiling on common integrated GPUs. One more photo like it
would have rendered as a silent black card.

Note this *improves* perceived quality. Drawing a 42-megapixel source into a
122 px card zone forced an extreme downsample that produced aliasing, not detail.

**`scripts/optimize-photos.py`** makes this repeatable: longest edge clamped to
1600 px, quality 82, 4:2:2 chroma, progressive, EXIF orientation applied then
stripped (PixiJS ignores EXIF, so an unrotated portrait renders sideways).
1600 px is chosen deliberately — the largest a photo is ever drawn is the
FocusView hero at 800×660, leaving 2× headroom.

Originals preserved at `projects/golf/source-photos/` (gitignored).

### The production build was broken

`npm run build` failed. A TS 6 deprecation error on `baseUrl` in
`tsconfig.app.json` aborted `tsc -b` before it reached the real problems, and
`dist/` on disk dated from July 28 — it predated all of Sprint 2. Deploying it
to the kiosk would have shown Sprint 1 code.

Removing `baseUrl` (redundant since TS 5.0; `paths` resolve relative to the
tsconfig) surfaced six genuine type errors that had been accumulating unseen:

- `ProjectLoader.merge` — `project.centerpiece ?? {}` widened to `{}`, hiding
  `dev` and **silently dropping the dev-overlay merge**. This was a real bug,
  not just a type complaint: dev overlays in `project.json` were being ignored.
- `useGallery` — `focusedIndexRef` typed as `React.RefObject<number>`, whose
  `current` is `readonly number | null`. Neither assignable nor valid as
  `FocusView.show(index: number)`. Retyped as a `{ current: number }` slot,
  matching the pattern `InteractionEngine` already uses.
- `SafeZoneShape.resolveSafeZone` — the `never` exhaustiveness guard cannot
  type-check while `SafeZoneShape` has a single member. Converted to a `switch`
  with a runtime throw and a comment on when to restore the compile-time guard.
- `centerpiece/index.ts` and `objects/index.ts` — re-exported `ExclusionZone`,
  deleted in the SafeZone refactor.
- `InteractionEngine` — unused `config` field, left behind when auto-timeout was
  removed. Removed along with the now-unused `config` param on `useInteraction`.

`typescript` pinned to `^6` in `apps/holobox/package.json` to match the 6.0.3
actually installed. The previous `^5` did not describe reality.

**Correction to a previous entry:** the 0010-A note claiming "TypeScript reports
zero errors" was true under TS 5 but had not held for some time.

### Verified

- `tsc -b --force` → exit 0
- `vite build` → 781 modules, built in 4.06 s
- All 16 photos visually inspected post-resize; no artifacts

### Content finding

The `golf-*.jpg` delivery set is **generic stock photography**, not client
content — country-club scenes and male amateur golfers. Earlier notes describing
them as "16 real golf photos" are accurate only in that they are photographs of
golf. Every asset in `projects/golf/` is Gaby López. The demo currently tells a
story about nobody. Raised as risk #2.

---

# End of Session — 2026-07-29 (0010-G: Content Pipeline + Decorations)

## What shipped

### Content Pipeline

The demo now runs on real Gaby López assets.

`projects/golf/Fotos/` (23 images) and `projects/golf/Videos/` (13 clips) are
the live content source. No files were renamed, moved, or duplicated. A Vite
plugin (`serveProjects`) intercepts `/projects/*` requests in dev and preview,
decoding URL-encoded filenames on the fly. Production serves `projects/`
alongside `dist/` at the same origin — consistent with Electron deployment,
where both directories are packaged together.

`PlayerData` now carries `mediaType?: 'photo' | 'video'` and `videoUrl?: string`.
Photos load textures normally. Video entries enter the pipeline as registered
items — orbit skips their texture load (null path falls through gracefully),
gallery shows them as blank thumbnail slots. When video rendering is implemented,
no structural changes are required: the URLs are already there.

`project.json` lists all 36 items: 23 photos (orbit shows first 8), 13 videos
(gallery only). Both `projects/golf/project.json` and `public/project.json` are
in sync and serve as the content contract.

### Scene Decorations

A configurable decoration layer is now part of the scene render stack:

```
background → decorBack → orbitBack → centerpiece → orbitFront → decorFront → effects → interaction → ui
```

`decorBack` sits behind the orbit — for ambient gradients and background
graphics. `decorFront` sits in front of the orbit, behind the UI layer — for
top frames, bottom branding, sponsor graphics, and tournament identity.

`DecorationLayer` loads PNG or SVG assets via PixiJS Assets. Each position (top
/ bottom) is individually configurable: `asset`, `opacity`, `offsetY`, `scale`.
The system is disabled in `project.json` (`enabled: false`) and is completely
inert — zero overhead — until design assets are ready.

## Current state

- 23 real Gaby López photos loading from `projects/golf/Fotos/`
- Gallery shows all 23 photos; videos recognized but not rendered
- Captions not yet populated (FocusView shows blank name/detail lines)
- Decorations: system built, disabled, ready to receive assets
- TypeScript: zero errors

## Known Risks (updated)

Risk #2 is now mitigated at the pipeline level: real assets are loading. The
demo tells Gaby López's story in visuals, if not yet in words. Captions remain
as 0010-E work.

