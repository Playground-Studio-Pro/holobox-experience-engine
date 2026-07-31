# Holobox Experience Engine

Version 0.1

---

# Current Goal

Current Milestone

Deliver a working Trophy Orbit demo for the Golf Tournament.

Deadline

August 3.

Long-term Mission

Build Holobox Experience Engine as a reusable platform for premium interactive experiences.

---

# Mission

Holobox Experience Engine is a reusable interactive runtime designed to power multiple premium experiences inside transparent Holobox displays.

The engine is NOT tied to any specific client or event.

Experiences are modular applications built on top of a common runtime.

Examples include

• Trophy Orbit

• AI Host

• Product Showcase

• Museum

• Timeline

• Hall of Fame

The objective is to maximize software reuse while minimizing project-specific code.

---

# Core Principles

The engine is offline-first.

The engine must remain deterministic.

Every experience is configuration-driven.

Visual quality has priority over feature quantity.

Performance is more important than visual complexity.

The centerpiece is always the visual hero.

Every interaction must affect the whole scene.

Animations should feel premium rather than flashy.

The application must recover automatically after inactivity.

---

# Engine Layers

Application

↓

Experience

↓

Scene

↓

Objects

↓

Animation

↓

Renderer

↓

PixiJS

↓

GPU

---

# CenterPiece System

Every experience contains exactly one CenterPiece.

Supported modes

Physical

Digital

Physical mode

The application reserves an exclusion zone.

A configurable placeholder pedestal ("Glorifier") is rendered during development.

This placeholder can be toggled on or off.

Digital mode

The engine renders a digital object.

The object supports

Idle animation

Rotation

Lighting

Scale

Future interaction

The renderer must not care whether the centerpiece is physical or digital.

The Scene only receives

CenterPiece

mode

physical | digital

---

# Scene

Every Scene contains

CenterPiece

Orbit Objects

Background

Interaction Layer

Particle Layer

UI Layer

---

# Orbit Objects

Current implementation

Photo

Future

Video

Player Card

Logo

Text

Statistics

QR

Every object supports

Position

Scale

Depth

Opacity

Glow

Animation Stack

Interaction State

---

# Motion Philosophy

Motion should never stop.

Motion should layer.

Examples

Orbit

Float

Tilt

Glow

Pulse

Opacity

Blur

Depth

Each layer remains independent.

Animations combine to create a living installation.

---

# Interaction Philosophy

The scene reacts.

Not only the selected object.

Touch should influence

Speed

Glow

Depth

Opacity

Scale

Focus

---

# Performance Goals

60 FPS

Offline

Touch latency under 50ms

Cold boot under 5 seconds

Automatic recovery

No memory leaks

---

# Reference Documents

See these files for deeper context — read them when making decisions about design, motion, or experience:

- `projects/golf/docs/CREATIVE_BRIEF.md` — creative vision, emotional goals, visual inspiration, design mantra
- `projects/golf/docs/experience-context.md` — hardware, safe zone, experience flow, orbit, visual language, particles

---

# Repository Structure

apps/

packages/

projects/

docs/

assets/

---

# Development Strategy

Build the engine first.

Build experiences second.

Never duplicate code between experiences.

Everything configurable.

Everything reusable.
