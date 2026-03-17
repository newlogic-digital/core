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
- Follow the existing import aggregation pattern with `+.js` files when adding new controllers to an existing folder.

**Local `initAfter` import pattern:**

```javascript
import { initAfter } from '../utils/+.js'

initAfter(document.querySelector('.newlyAppendedContent'))
```

**Aggregator pattern:**

```javascript
// src/scripts/components/(ui)/+.js
import './Button.js'
import './Dialog.js'
```

## Before Adding JS

- Prefer existing Winduum, Stimulus, or utility behavior from `llms-full.txt` before creating new custom JS.
- Do NOT introduce a second interaction pattern if the repo already has an established controller for the same problem.
