# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite, React, and TypeScript. Fully client-side. Vitest for the engine. Progress in localStorage. `npm run build` emits a static PWA with a service worker and web app manifest, and no backend, auth, database, or API.

## Users

A single learner practicing a round, or two classmates each on their own device. A teacher can hand them a link to a level range.

## Product Purpose

Teach people to reason like a browser: which rules match, then importance, specificity, then source order. Success is a player who can say why a declaration won, in the `0-1-2-1` tuple, without adding the digits into one number.

## Positioning

The graded rounds are hand-written, and every answer is checked by an owned specificity engine. After each answer, the explanation says why that result won.

## Operating Context

A bright classroom, short rounds between other work. Solo practice or learn on the path, or two-device play. A hash such as `#set=1-5` opens that level range for two devices with no server. Names in a two-player round exist only for that session.

## Capabilities and Constraints

- Levels 1–7, about ten questions each. Level 1 is Wie wordt er geselecteerd: a chunk of HTML and one selector, and the player marks every element that selector matches. Badges start at two stars: Selector Rookie at two on level 1, Element Scout at three on level 1. Levels 2–6 compare a specificity tuple, a selector battle (`a`, `b`, or `tie`), or the winning rule. Level 7 is `!important`. Two stars there earn !important Survivor.
- The home screen offers solo play and two-device play. Solo starts the next open level without a star. Two-device play can start any of the seven levels immediately.
- Solo rounds use streak and stars. Hearts exist only in two-device play.
- Next level unlocks at one star. Three stars require 95% and every trap in that run correct.
- UI copy is Dutch. Selectors, properties, and the `0-1-2-1` notation stay as written in CSS.
- No accounts, global leaderboard, or classroom dashboard. Two devices connect with a pasted WebRTC code and a public STUN server. `MatchTransport` and `QuizSet` are the seams.

## Brand Commitments

The interface is the shared laptop in that classroom: high contrast, one saturated color carrying the arena, selectors in IBM Plex Mono, a grotesque for the UI. Not a dark code editor, not a cream dashboard, not a grid of level cards.

## Evidence on Hand

Original question copy and an original selector engine. No customer quotes, logos, research studies, or press. Do not invent them.

## Product Principles

- Explain the result in words after every answer.
- Never collapse specificity into a sum.
- Graded truth is written by hand and proved by the engine.
- A learning round is not an exam: lives belong to the race, not to solo practice.
- A teacher can share a set with a URL and nothing else.

## Accessibility & Inclusion

Body text at least 4.5:1. Every question can be answered from the keyboard. `prefers-reduced-motion` fades instead of moving. Target sizes stay comfortable on a phone held between two people.
