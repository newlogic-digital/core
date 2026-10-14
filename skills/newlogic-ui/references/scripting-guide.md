# Scripting Guide

## Placement

- Entry point is `src/scripts/main.js`.
- Shared setup belongs in `src/scripts/composables/`.
- Reusable helpers belong in `src/scripts/utils/`.
- Custom component controllers belong in `src/scripts/components/`.
- Winduum-based UI controllers belong in `src/scripts/components/(ui)/`.

## Local Rules

- Use modern plain JS that matches the existing codebase.
- Register one primary controller per file.
- Keep controller names aligned with existing `x-*` naming in this repo.
- If dynamic HTML is inserted into the DOM, ALWAYS re-initialize it with `src/scripts/utils/initAfter.js`.
- Import aggregation pattern in `+.js` is generated automatically via Vite plugin, do not manually add imports.

## Before Adding JS

- Prefer existing Winduum, Stimulus, or utility behavior from `llms-full.txt` before creating new custom JS.
- Do NOT introduce a second interaction pattern if the repo already has an established controller for the same problem.
