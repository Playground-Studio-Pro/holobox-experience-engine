# Trophy Orbit — Implementation Brief

> Status: Approved. Moving from visual exploration into implementation.

The approved visual direction is the **TOP design** from the "Trophy Orbit - Creative Direction" artifact.

Visual references:
- `references/design/trophy-orbit-approved.html` — standalone HTML from Claude Design
- `references/design/trophy-orbit-approved.png` — approved screenshot

Treat both as **visual references only**. Do not copy the bundled artifact runtime or use it as the production architecture.

Implement this design inside the existing Holobox Experience Engine.

---

## Before Writing Code

Read:

- `CLAUDE.md`
- `ENGINE_SPEC.md`
- `PROJECT_CONTEXT.md`
- `ENGINE_TASKS.md`
- `docs/TROPHY_ORBIT_VISUAL_SPEC.md`
- `public/project.json`

Inspect the existing:

- Scene
- CenterPiece
- Orbit
- Motion
- PhotoItem
- Gallery
- Experience Loader
- project configuration structure

Identify which existing systems can produce the approved composition without adding client-specific logic to the engine core.

---

## Approved Visual Direction

**Canvas**
- Vertical 9:16 Holobox display
- White lightbox background
- Premium editorial exhibition aesthetic
- Minimal visible interface

**Header**
- Gaby López event logo centered horizontally at the top
- No secondary information beside the logo
- Generous white space around it

**Centerpiece**
- The trophy is the permanent central anchor
- Must remain centered on its pedestal
- Photographs must never substantially cover the trophy
- Respect actual trophy model proportions
- Do not use a generic replacement trophy

**Photos**
- Approximately four photographs clearly visible at one time
- One dominant horizontal image in the upper region
- Smaller portrait or editorial images on the left and right sides
- Asymmetrical but balanced composition
- Photos orbit in spatial depth — not a flat carousel

**Incoming-photo preview**
- Additional photographs appear subtly behind the primary photos using:
  - lower opacity
  - reduced scale
  - subtle blur
  - lower contrast
  - increased depth
- They suggest more memories are approaching through the orbit
- Background images must never compete with the primary four

**Orbit**
- Subtle elliptical or spiral visual path
- Line is decorative and secondary
- Motion: slow, elegant, continuous
- Some images may enter from behind the centerpiece
- Feel: spatial and museum-like — never a website slider

**Photo sequencing**
- Shuffled photo queue
- No repeat until every available photo has been shown once
- Reshuffle at end of queue
- Randomization logic must remain reusable — no Gaby López references
- Persist queue during active session

**Footer**
- All editorial player information in bottom-left corner
- Remove Round and Hole block from bottom-right completely
- No replacement UI in that area
- Hierarchy:
  1. small status/leader label
  2. player name
  3. supporting metadata
- Typography: exhibition-style, not an app interface

**Interaction**
- Idle mode: orbit + trophy
- On photo selection: slow orbit, bring image forward, reduce background opacity, preserve trophy visibility
- On close: return image smoothly to prior orbit position, restore orbit speed and opacity
- No abrupt transitions

---

## Architecture Constraints

- Keep the engine client-agnostic
- Put event-specific assets, copy and layout values in `project.json` or an experience-specific config file
- Do not hardcode "Gaby López" inside reusable engine classes
- Reuse existing Orbit, Motion, PhotoItem and Gallery systems where possible
- Extend the engine only when the behavior is genuinely reusable
- Maintain transparent-renderer compatibility even though this experience uses a white background
- Target stable 60 FPS on the Holobox PC
- Avoid DOM-heavy overlays if the existing PixiJS renderer can handle them
- Load assets locally and support offline playback

---

## Implementation Order

Do not implement the entire experience at once.

**First ticket — visual composition only:**

1. Centered logo
2. Correct trophy and pedestal placement
3. Four-photo approved composition
4. Background ghost-photo depth treatment
5. Bottom-left typography
6. Removal of bottom-right Round/Hole information

Use static photos first.

After the static composition matches the approved reference, stop and request review before implementing orbit animation or random sequencing.

---

## Deliverables — First Pass

- List every file changed
- Explain which values are configurable
- Provide one screenshot at the Holobox target resolution
- State any visual mismatch with the approved reference
- Update:
  - `PROJECT_CONTEXT.md`
  - `ENGINE_TASKS.md`
  - `docs/TROPHY_ORBIT_VISUAL_SPEC.md`
- Create a commit with a focused message for the visual-composition ticket

Do not redesign the approved direction.
Do not add new UI.
Do not polish motion before the static frame is approved.
