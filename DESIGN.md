---
name: Specificiteit
description: A classroom race for CSS specificity, played on one shared laptop.
colors:
  paper: "oklch(1 0 0)"
  surface: "oklch(0.955 0 0)"
  ink: "oklch(0.220 0.025 55)"
  muted: "oklch(0.400 0.020 58)"
  honey: "oklch(0.500 0.145 58)"
  honey-on: "oklch(1 0 0)"
  chalk: "oklch(0.280 0.080 255)"
  line: "oklch(0.220 0.025 55)"
typography:
  display:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "clamp(2.75rem, 7vw, 5.25rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "clamp(1.5rem, 4vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.25
rounded:
  panel: "12px"
  well: "8px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.honey}"
    textColor: "{colors.honey-on}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
    typography: "{typography.label}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
    typography: "{typography.label}"
  arena-row:
    backgroundColor: "{colors.honey}"
    textColor: "{colors.honey-on}"
    padding: "20px 24px"
    typography: "{typography.headline}"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "16px"
---

# Design System: Specificiteit

## Overview

**Creative North Star: "The Shared Laptop"**

Two classmates lean over one machine in a bright classroom. The page is that laptop: white daylight, ink, and a single saturated honey that is the arena they are racing inside. The specimen — the selector or the rule — is the page. Everything else keeps its distance.

The palette anchor came from Impeccable’s palette script (`--from css-specificity-game`, seed-148): `oklch(0.650 0.146 60)`. Hue stays within a few degrees of 60°. Lightness is pulled down so white type on the arena clears 4.5:1. The ground is pure white, not a tinted cream. Chalk blue appears only to tell the second player apart.

Schibsted Grotesk carries the Dutch UI. IBM Plex Mono is reserved for selectors, properties, and the `0-1-2-1` notation, because the brief pins that face for CSS as written.

**Key Characteristics:**

- One honey field does the shouting. White and ink do the reading.
- Levels are a vertical path, a real sequence, never a card grid.
- Panels are flat, framed with a 2px ink line, radius at most 16px.
- Controls are pills. The arena rows are full-bleed, not tiles.
- Motion is a short ease-out stagger when tokens land. Reduced motion fades.

## Colors

Committed: honey carries the arena (the primary actions, the current station, a correct specimen). It is not sprinkled as a tiny accent on a gray app.

The seed read was “editorial gold.” The classroom scene overrides that mood: daylight, high contrast, the color as a block you can point at from arm’s length. Hue 58°, chroma 0.145, lightness 0.50.

### Primary

- **Arena honey** (`oklch(0.500 0.145 58)`): the race. Home actions, the current level, a correct answer, primary buttons. White text on this fill.

### Secondary

- **Chalk** (`oklch(0.280 0.080 255)`): player B in a two-device reveal, and nothing else. White text when the fill is chalk.

### Neutral

- **Paper** (`oklch(1 0 0)`): the page.
- **Surface** (`oklch(0.955 0 0)`): a recess for the sandbox frame. Neutral, not warm.
- **Ink** (`oklch(0.220 0.025 55)`): body text, rules, the path line.
- **Muted ink** (`oklch(0.400 0.020 58)`): secondary sentences. Still above 4.5:1 on paper.

### Named Rules

**The One Arena Rule.** Honey is a region, not a highlight. If a screen has no race to point at, honey stays on the single primary action.

**The White Text Rule.** Type on honey or chalk is white. Ink sits on paper and on pale surface, never on the saturated fill.

## Typography

**Display Font:** Schibsted Grotesk (with ui-sans-serif)
**Body Font:** Schibsted Grotesk (with ui-sans-serif)
**Label/Mono Font:** IBM Plex Mono for selectors and tuples only

**Character:** A schoolbook grotesque beside a mono that looks like the CSS the browser actually parsed. Mono is never used for Dutch sentences.

### Hierarchy

- **Display** (700, clamp 2.75rem–5.25rem, line-height 0.92): the home heading and the specimen selector.
- **Headline** (700, clamp 1.75rem–2.25rem): arena actions, results heading.
- **Title** (700, 1.25rem): level names on the path.
- **Body** (450, 1.0625rem, line-height 1.5, measure up to 65ch): prompts, explanations.
- **Label** (600, 0.875rem): stepper captions, hud.

### Named Rules

**The Code Face Rule.** IBM Plex Mono is for selectors, properties, values, and `0-1-2-1`. UI words stay in the grotesque.

## Layout

The specimen is the page. Play is one column: the question, the answer, then the explanation. Home is a heading on paper, then one honey block of actions to the bottom edge. The level path is a single vertical sequence with a 2px spine. No equal card grid, no dashboard of metrics.

Spacing steps are 4, 8, 16, 24, and 48. More space above a heading than below it. Page padding is 20px on a phone and 40px from 800px up.

## Elevation & Depth

Flat. Depth is a honey field against paper, or a 2px ink frame. There is no drop shadow vocabulary.

### Named Rules

**The No Halo Rule.** Do not add a wide soft shadow, a glow, or a 1px border that tries to look lifted.

## Shapes

Pills for buttons, stepper controls, and choice chips. Panels and the sandbox frame use 12px, never more than 16px. The path stations are circles because they are points on a line, not cards.

## Components

### Buttons

- **Shape:** pill (999px).
- **Primary:** honey fill, white label, padding 12px 22px. Hover darkens the fill slightly without moving the button.
- **Hover / Focus:** focus-visible is a 3px outline, honey on paper and white on honey, offset 3px.
- **Secondary:** paper fill, 2px ink border, ink label.

### Arena rows

- **Shape:** full width of the honey field, separated by 2px paper rules.
- **Type:** headline, white.
- **State:** hover shifts the row to a deeper honey. No lift.

### Cards / Containers

- **Corner Style:** 12px when a frame is needed (feedback, sandbox).
- **Background:** paper, or surface for the sandbox well.
- **Shadow Strategy:** none.
- **Border:** 2px ink, or none when the region is already the honey field.
- **Internal Padding:** 16px.

### Inputs / Fields

- **Style:** 2px ink border, paper fill, pill, padding 12px 16px.
- **Focus:** 3px honey outline.
- **Error / Disabled:** disabled stations are muted ink on paper, still framed, never a gray box with gray type below 4.5:1.

### Navigation

- **Style:** a wordmark and two text links. No bar of pills. Current route is underlined in honey.

### Stepper

- **Style:** four rows, one per tuple slot. Minus and plus are pills. The live notation is IBM Plex Mono.

### Level path

- **Style:** an ordered list, a vertical 2px spine, numbered discs. The open level’s disc is honey. This is the signature, and it is a sequence.

## Do's and Don'ts

### Do:

- **Do** keep honey on the arena, the current station, and the primary action.
- **Do** use `0-1-2-1` in IBM Plex Mono whenever a tuple is the point.
- **Do** fade token entrances when `prefers-reduced-motion: reduce` is set.

### Don't:

- **Don't** use a dark code-editor theme, a cream or sand page, or a grid of identical level cards.
- **Don't** use gradient text, glassmorphism, side-stripe borders, eyebrow labels above headings, or hero-metric XP blocks.
- **Don't** pair a 1px border with a wide shadow, or use a panel radius of 24px or more.
- **Don't** use bounce or elastic easing.
- **Don't** put Dutch prose in the mono face, or CSS selectors in the grotesque.
