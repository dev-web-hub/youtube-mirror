# Cubecast Feed Contract

`feed.json` is a stable, authoritative input artifact.

## Rules
- No runtime generation
- No filesystem scanning
- No implicit sorting
- Order is intentional
- Contents may be partial, experimental, or themed

## Purpose
This enables:
- Deterministic UX
- Curated sequences
- A/B playlists
- Campaign-specific feeds
- Future server-driven feeds

## Engine Assumption
The doomscroll engine:
- Loads `feed.json`
- Trusts order as-is
- Never mutates it

This is intentional.
