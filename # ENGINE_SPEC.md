# ENGINE_SPEC.md

# Holobox Experience Engine

Version: 0.1

---

# Mission

Holobox Experience Engine is a reusable runtime for building premium interactive experiences inside Holobox displays.

The engine is independent from any specific client, event or industry.

Experiences are created through configuration, assets and plugins—not by modifying the engine.

---

# Core Principles

- Offline First
- Configuration Driven
- Modular
- Reusable
- Touch First
- 60 FPS Target
- Premium Motion
- CenterPiece is always the hero

---

# Engine Architecture

Holobox Engine

├── Scene
├── Renderer
├── Animation System
├── Interaction System
├── Asset Manager
├── Configuration
└── Experience

---

# Core Entities

## Scene

Owns the complete experience.

Contains:

- CenterPiece
- Orbit Layer
- UI Layer
- Effects Layer
- Interaction Layer

Only one Scene is active at a time.

---

## Renderer

The Engine always renders using a virtual coordinate system.

Default

1080 × 1920

Viewport scaling must never modify engine coordinates.

Scaling belongs exclusively to the Renderer.

---

## CenterPiece

Represents the primary object.

Modes

- Physical
- Digital

Properties

- position
- scale
- exclusionZone
- placeholder
- glorifier
- visible

Development Features

- Toggle Placeholder
- Toggle Glorifier
- Toggle Safe Zone

---

## OrbitItem

Any object orbiting the CenterPiece.

Supported Types

- Photo
- Video
- Card
- Logo
- Text

Properties

- id
- position
- depth
- scale
- opacity
- rotation
- animationStack
- interactionState

---

## Animation System

Animations are composable.

Supported

- Orbit
- Float
- Pulse
- Glow
- Scale
- Rotate
- Fade
- Blur
- Focus

Animations may run simultaneously.

---

## Interaction System

States

Idle

Hover

Touch

Focus

Gallery

Return

Reset

Interactions affect the entire Scene, not only the selected object.

---

# Experience

An Experience defines:

- Assets
- Theme
- Motion Profile
- CenterPiece Mode
- UI
- Configuration

Examples

- Trophy Orbit
- Product Showcase
- Museum
- AI Host

---

# Configuration

Every Experience is driven by:

project.json

No code changes should be required to create a new experience.

---

# Performance Targets

- 60 FPS
- Offline Operation
- Touch latency < 50 ms
- Auto Recovery
- Fullscreen
- Kiosk Ready

---

# Development Philosophy

The Engine never contains client-specific logic.

Client customization belongs inside an Experience.

If a feature could be reused, it belongs to the Engine.

If it only serves one customer, it belongs to the Experience.
