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

Status: TODO

------------------------------------------------------------------------

# 0003 --- Scene System

## Goal

Create the Scene manager.

## Contains

-   CenterPiece
-   Orbit Layer
-   Effects Layer
-   UI Layer

Status: TODO

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

Status: TODO

------------------------------------------------------------------------

# 0005 --- Orbit Engine

## Goal

Render orbiting content.

## Acceptance Criteria

-   8 visible orbit items
-   Elliptical orbits
-   Depth simulation
-   Exclusion zone respected

Status: TODO

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

Status: TODO

------------------------------------------------------------------------

# 0007 --- Touch Engine

## Goal

Scene-wide interaction.

## Flow

Touch → Slow orbit → Highlight selection → Expand item → Enter Gallery

Status: TODO

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

Status: TODO

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

Status: TODO

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
